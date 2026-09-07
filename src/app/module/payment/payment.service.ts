import Stripe from "stripe";
import { Prisma } from "../../../generated/prisma/client";
import { PaymentStatus } from "../../../generated/prisma/enums";
import envConfig from "../../envConfig";
import { prisma } from "../../lib/prisma"
import { stripe } from "../../lib/stripe";

const initiatePayment = async (contractId: string, clientId: string) => {
    const contract = await prisma.contract.findUnique({
        where: { id: contractId },
        include: {
            job: true,
            freelancer: true
        }
    });

    if (!contract) {
        throw new Error(`Contract not found.`)
    }
    if (contract.clientId !== clientId) {
        throw new Error(`You do not have permission to initialize payment for this contract.`)
    }

    const amount = Number(contract.agreedPrice);
    const platformCommission = Math.round(amount * 0.1 * 100) / 100
    const freelancerEarns = amount - platformCommission

    const existingPayment = await prisma.payment.findFirst({
        where: { contractId, status: { in: [PaymentStatus.PENDING, PaymentStatus.SUCCEEDED] } }
    });
    if (existingPayment) {
        if (existingPayment.status === PaymentStatus.SUCCEEDED) {
            throw new Error("Payment already completed for this contract.");
        }
        const oldSession = await stripe.checkout.sessions.retrieve(existingPayment.stripePaymentIntentId!);
        if (oldSession.status === 'open') {
            return {
                payment: existingPayment,
                checkoutUrl: oldSession.url,
                publishableKey: envConfig.stripe_publishable_key
            };
        }

        await prisma.payment.update({
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

    const payment = await prisma.payment.create({
        data: {
            contractId,
            clientId,
            freelancerId: contract.freelancerId,
            amount: new Prisma.Decimal(amount),
            platformCommission: new Prisma.Decimal(platformCommission),
            freelancerEarns: new Prisma.Decimal(freelancerEarns),
            status: PaymentStatus.PENDING,
            stripePaymentIntentId: session.id
        }
    });

    return {
        payment,
        checkoutUrl: session.url,
        publishableKey: envConfig.stripe_publishable_key
    }
}

const handleWebhook = async (event: Stripe.Event) => {
    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object as Stripe.Checkout.Session;

            const payment = await prisma.payment.findUnique({
                where: { stripePaymentIntentId: session.id }
            });
            if (!payment) throw new Error("Payment record not found.");

            const expectedAmount = Math.round(Number(payment.amount) * 100);
            if (session.amount_total !== expectedAmount) {
                throw new Error("Payment amount mismatch.");
            }
            // if (session.currency !== "usd") {
            //     throw new Error("Payment currency mismatch.");
            // }

            await prisma.payment.update({
                where: { id: payment.id },
                data: { status: PaymentStatus.SUCCEEDED }
            });
            break;
        }

        case 'checkout.session.expired': {
            const session = event.data.object as Stripe.Checkout.Session;

            await prisma.payment.updateMany({
                where: { stripePaymentIntentId: session.id, status: PaymentStatus.PENDING },
                data: { status: PaymentStatus.FAILED }
            });
            break;
        }

        default:
            return;
    }
}

const getPayment = async (paymentId: string, userId: string) => {
    const payment = await prisma.payment.findUnique({
        where: { id: paymentId }
    })

    if (!payment) {
        throw new Error(`Payment not found.`)
    }
    if (
        payment.clientId !== userId &&
        payment.freelancerId !== userId
    ) {
        throw new Error("You do not have permission to view this payment.");
    }

    return payment;
}

const verifySession = async (sessionId: string) => {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === 'paid') {
        await prisma.payment.updateMany({
            where: { stripePaymentIntentId: sessionId, status: PaymentStatus.PENDING },
            data: { status: PaymentStatus.SUCCEEDED }
        });
    }

    return prisma.payment.findUnique({ where: { stripePaymentIntentId: sessionId } });
}

export const PaymentService = {
    initiatePayment,
    handleWebhook,
    getPayment,
    verifySession
}