import httpStatus from "http-status";
import Stripe from "stripe";
import { Prisma, PrismaClient } from "../../../generated/prisma/client";
import {
	ContractStatus,
	JobStatus,
	PaymentStatus,
	ProposalStatus,
} from "../../../generated/prisma/enums";
import envConfig from "../../envConfig";
import { prisma } from "../../lib/prisma";
import { stripe } from "../../lib/stripe";
import { AppError } from "../../utils/AppError";
import { logAction } from "../../utils/auditlog";

const initiatePayment = async (contractId: string, clientId: string) => {
	// unchanged — leaving as-is, no longer used by the accept-proposal flow
	// but harmless to keep around
	const contract = await prisma.contract.findUnique({
		where: { id: contractId },
		include: {
			job: true,
			freelancer: true,
		},
	});

	if (!contract) {
		throw new AppError(httpStatus.NOT_FOUND, `Contract not found.`);
	}
	if (contract.clientId !== clientId) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			`You do not have permission to initialize payment for this contract.`,
		);
	}

	const amount = Number(contract.agreedPrice);
	const platformCommission = Math.round(amount * 0.1 * 100) / 100;
	const freelancerEarns = amount - platformCommission;

	const session = await prisma.$transaction(async (tx) => {
		const existingPayment = await tx.payment.findFirst({
			where: {
				contractId,
				status: { in: [PaymentStatus.PENDING, PaymentStatus.SUCCEEDED] },
			},
		});
		if (existingPayment) {
			if (existingPayment.status === PaymentStatus.SUCCEEDED) {
				throw new AppError(
					httpStatus.CONFLICT,
					"Payment already completed for this contract.",
				);
			}
			const oldSession = await stripe.checkout.sessions.retrieve(
				existingPayment.stripeSessionId!,
			);
			if (oldSession.status === "open") {
				return {
					payment: existingPayment,
					checkoutUrl: oldSession.url,
					publishableKey: envConfig.stripe_publishable_key,
				};
			}

			await tx.payment.update({
				where: { id: existingPayment.id },
				data: { status: PaymentStatus.FAILED },
			});
		}

		const session = await stripe.checkout.sessions.create({
			payment_method_types: ["card"],
			line_items: [
				{
					price_data: {
						currency: "usd",
						product_data: {
							name: `Contract Payment: ${contract.job.title}`,
						},
						unit_amount: Math.round(amount * 100),
					},
					quantity: 1,
				},
			],
			mode: "payment",
			success_url: `${envConfig.client_url}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
			cancel_url: `${envConfig.client_url}/payment/cancel`,
			metadata: {
				contractId,
				clientId,
				freelancerId: contract.freelancerId,
				jobId: contract.jobId,
			},
		});

		const createdPayment = await tx.payment.create({
			data: {
				contractId,
				clientId,
				freelancerId: contract.freelancerId,
				amount: new Prisma.Decimal(amount),
				platformCommission: new Prisma.Decimal(platformCommission),
				freelancerEarns: new Prisma.Decimal(freelancerEarns),
				status: PaymentStatus.PENDING,
				stripeSessionId: session.id,
			},
		});

		return {
			checkoutUrl: session.url,
		};
	});
	return {
		checkoutUrl: session.checkoutUrl,
	};
};

const handleWebhook = async (event: Stripe.Event) => {
	return await prisma.$transaction(async (tx) => {
		switch (event.type) {
			case "checkout.session.completed": {
				const session = event.data.object as Stripe.Checkout.Session;

				if (session.metadata?.type === "proposal_acceptance") {
					const {
						jobId,
						proposalId,
						clientId,
						freelancerId,
						agreedPrice,
						agreedTimeline,
					} = session.metadata as Record<string, string>;

					const proposal = await tx.proposal.findUnique({
						where: { id: proposalId },
						include: { job: true },
					});

					const stillValid =
						proposal &&
						proposal.status === ProposalStatus.PENDING &&
						proposal.job.status === JobStatus.OPEN &&
						proposal.job.deadline > new Date();

					if (!stillValid) {
						if (session.payment_intent) {
							await stripe.refunds.create({
								payment_intent: session.payment_intent as string,
							});
						}
						await logAction(
							tx,
							clientId,
							"PAYMENT_REFUNDED_INVALID_PROPOSAL",
							"Proposal",
							proposalId,
						);
						return;
					}

					await tx.proposal.updateMany({
						where: { jobId, id: { not: proposalId } },
						data: { status: ProposalStatus.REJECTED },
					});
					await tx.proposal.update({
						where: { id: proposalId },
						data: { status: ProposalStatus.ACCEPTED },
					});

					const contract = await tx.contract.create({
						data: {
							jobId,
							proposalId,
							clientId,
							freelancerId,
							agreedPrice: new Prisma.Decimal(agreedPrice),
							agreedTimeline: Number(agreedTimeline),
							status: ContractStatus.ACTIVE,
						},
					});

					await tx.job.update({
						where: { id: jobId },
						data: { status: JobStatus.IN_PROGRESS },
					});

					const amount = Number(agreedPrice);
					const platformCommission = Math.round(amount * 0.1 * 100) / 100;
					const freelancerEarns = amount - platformCommission;

					await tx.payment.create({
						data: {
							contractId: contract.id,
							clientId,
							freelancerId,
							amount: new Prisma.Decimal(amount),
							platformCommission: new Prisma.Decimal(platformCommission),
							freelancerEarns: new Prisma.Decimal(freelancerEarns),
							status: PaymentStatus.SUCCEEDED,
							stripeSessionId: session.id,
						},
					});

					await tx.freelancer.update({
						where: { userId: freelancerId },
						data: { totalEarnings: { increment: freelancerEarns } },
					});

					await tx.client.update({
						where: { userId: clientId },
						data: { totalSpent: { increment: amount } },
					});

					await logAction(
						tx,
						clientId,
						"CONTRACT_ACCEPTED",
						"CONTRACT",
						contract.id,
					);
					await logAction(
						tx,
						clientId,
						"PAYMENT_SUCCEEDED",
						"Payment",
						contract.id,
					);

					return;
				}

				const payment = await tx.payment.findUnique({
					where: { stripeSessionId: session.id },
				});
				if (!payment)
					throw new AppError(httpStatus.NOT_FOUND, "Payment record not found.");

				const expectedAmount = Math.round(Number(payment.amount) * 100);
				if (session.amount_total !== expectedAmount) {
					throw new AppError(
						httpStatus.BAD_REQUEST,
						"Payment amount mismatch.",
					);
				}
				if (session.currency !== "usd") {
					throw new AppError(
						httpStatus.BAD_REQUEST,
						"Payment currency mismatch.",
					);
				}
				if (payment.status === PaymentStatus.SUCCEEDED) return;

				await tx.payment.update({
					where: { id: payment.id },
					data: { status: PaymentStatus.SUCCEEDED },
				});

				await tx.freelancer.update({
					where: { userId: payment.freelancerId },
					data: { totalEarnings: { increment: payment.freelancerEarns } },
				});

				await tx.client.update({
					where: { userId: payment.clientId },
					data: { totalSpent: { increment: payment.amount } },
				});

				await logAction(
					tx,
					payment.clientId,
					"PAYMENT_SUCCEEDED",
					"Payment",
					payment.id,
				);

				break;
			}

			case "checkout.session.expired": {
				const session = event.data.object as Stripe.Checkout.Session;

				if (session.metadata?.type === "proposal_acceptance") {
					return;
				}

				await tx.payment.updateMany({
					where: { stripeSessionId: session.id, status: PaymentStatus.PENDING },
					data: { status: PaymentStatus.FAILED },
				});
				await logAction(
					tx,
					null,
					"PAYMENT_FAILED",
					"Payment",
					session.id as string,
				);

				break;
			}

			default:
				return;
		}
	});
};

const getPayment = async (paymentId: string, userId: string) => {
	const payment = await prisma.payment.findUnique({
		where: { id: paymentId },
	});

	if (!payment) {
		throw new AppError(httpStatus.NOT_FOUND, `Payment not found.`);
	}
	if (payment.clientId !== userId && payment.freelancerId !== userId) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"You do not have permission to view this payment.",
		);
	}

	return payment;
};

const verifySession = async (sessionId: string) => {
	const session = await stripe.checkout.sessions.retrieve(sessionId);

	if (session.payment_status === "paid") {
		await prisma.payment.update({
			where: { stripeSessionId: sessionId, status: PaymentStatus.PENDING },
			data: { status: PaymentStatus.SUCCEEDED },
		});
	}

	return prisma.payment.findUnique({ where: { stripeSessionId: sessionId } });
};

export const PaymentService = {
	initiatePayment,
	handleWebhook,
	getPayment,
	verifySession,
};