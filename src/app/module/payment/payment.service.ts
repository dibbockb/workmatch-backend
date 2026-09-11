import Stripe from "stripe";
import { Prisma, PrismaClient } from "../../../generated/prisma/client";
import { ContractStatus, PaymentStatus } from "../../../generated/prisma/enums";
import envConfig from "../../envConfig";
import { prisma } from "../../lib/prisma"
import { stripe } from "../../lib/stripe";
import { logAction } from "../../utils/auditlog";
import { AppError } from "../../utils/AppError";
import httpStatus from "http-status";

const initiatePayment = async (contractId: string, clientId: string) => {
    const contract = await prisma.contract.findUnique({
        where: { id: contractId },
        include: {
            job: true,
            freelancer: true
        }
    });

    if (!contract) {
        throw new AppError(httpStatus.NOT_FOUND, `Contract not found.`)
    }
    if (contract.clientId !== clientId) {
        throw new AppError(httpStatus.FORBIDDEN, `You do not have permission to initialize payment for this contract.`)
    }

    const amount = Number(contract.agreedPrice);
    const platformCommission = Math.round(amount * 0.1 * 100) / 100
    const freelancerEarns = amount - platformCommission

    const session = await prisma.$transaction(async (tx) => {
        const existingPayment = await tx.payment.findFirst({
            where: { contractId, status: { in: [PaymentStatus.PENDING, PaymentStatus.SUCCEEDED] } }
        });
        if (existingPayment) {
            if (existingPayment.status === PaymentStatus.SUCCEEDED) {
                throw new AppError(httpStatus.CONFLICT, "Payment already completed for this contract.");
            }
            const oldSession = await stripe.checkout.sessions.retrieve(existingPayment.stripeSessionId!);
            if (oldSession.status === 'open') {
                return {
                    payment: existingPayment,
                    checkoutUrl: oldSession.url,
                    publishableKey: envConfig.stripe_publishable_key
                };
            }

            await tx.payment.update({
                where: { id: existingPayment.id },
                data: { status: PaymentStatus.FAILED }
            });
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: `Contract Payment: ${contract.job.title}`,
                        },
                        unit_amount: Math.round(amount * 100),
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${envConfig.client_url}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${envConfig.client_url}/payment/cancel`,
            metadata: {
                contractId,
                clientId,
                freelancerId: contract.freelancerId,
                jobId: contract.jobId
            }
        })

        const createdPayment = await tx.payment.create({
            data: {
                contractId,
                clientId,
                freelancerId: contract.freelancerId,
                amount: new Prisma.Decimal(amount),
                platformCommission: new Prisma.Decimal(platformCommission),
                freelancerEarns: new Prisma.Decimal(freelancerEarns),
                status: PaymentStatus.PENDING,
                stripeSessionId: session.id
            }
        });

        return {
            checkoutUrl: session.url,
        }
    })
    return {
        checkoutUrl: session.checkoutUrl
    };
}

const handleWebhook = async (event: Stripe.Event) => {
    return await prisma.$transaction(async (tx) => {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;

                const payment = await tx.payment.findUnique({
                    where: { stripeSessionId: session.id }
                });
                if (!payment) throw new AppError(httpStatus.NOT_FOUND, "Payment record not found.");

                const expectedAmount = Math.round(Number(payment.amount) * 100);
                if (session.amount_total !== expectedAmount) {
                    throw new AppError(httpStatus.BAD_REQUEST, "Payment amount mismatch.");
                }
                if (session.currency !== "usd") {
                    throw new AppError(httpStatus.BAD_REQUEST, "Payment currency mismatch.");
                }
                if (payment.status === PaymentStatus.SUCCEEDED) return;

                await tx.payment.update({
                    where: { id: payment.id },
                    data: { status: PaymentStatus.SUCCEEDED }
                });

                await tx.freelancer.update({
                    where: { userId: payment.freelancerId },
                    data: { totalEarnings: { increment: payment.freelancerEarns } }
                })

                await tx.client.update({
                    where: { userId: payment.clientId },
                    data: { totalSpent: { increment: payment.amount } }
                })

                await tx.contract.update({
                    where: { id: payment.contractId },
                    data: { status: ContractStatus.COMPLETED }
                })

                await logAction(tx, payment.clientId, "PAYMENT_SUCCEEDED", "Payment", payment.id);

                break;
            }

            case 'checkout.session.expired': {
                const session = event.data.object as Stripe.Checkout.Session;

                await tx.payment.updateMany({
                    where: { stripeSessionId: session.id, status: PaymentStatus.PENDING },
                    data: { status: PaymentStatus.FAILED }
                });
                await logAction(tx, null, "PAYMENT_FAILED", "Payment", session.id as string);

                break;
            }

            default:
                return;
        }
    })
}

const getPayment = async (paymentId: string, userId: string) => {
    const payment = await prisma.payment.findUnique({
        where: { id: paymentId }
    })

    if (!payment) {
        throw new AppError(httpStatus.NOT_FOUND, `Payment not found.`)
    }
    if (
        payment.clientId !== userId &&
        payment.freelancerId !== userId
    ) {
        throw new AppError(httpStatus.FORBIDDEN, "You do not have permission to view this payment.");
    }

    return payment;
}

const verifySession = async (sessionId: string) => {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === 'paid') {
        await prisma.payment.updateMany({
            where: { stripeSessionId: sessionId, status: PaymentStatus.PENDING },
            data: { status: PaymentStatus.SUCCEEDED }
        });
    }

    return prisma.payment.findUnique({ where: { stripeSessionId: sessionId } });
}

export const PaymentService = {
    initiatePayment,
    handleWebhook,
    getPayment,
    verifySession
}