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
        where: {
            contractId,
            status: {
                in: [
                    PaymentStatus.PENDING,
                    PaymentStatus.SUCCEEDED
                ]
            }
        }
    });
    if (existingPayment) {
        throw new Error("Payment already exists for this contract.");
    }

    const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: 'usd',
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
            amount: Prisma.Decimal(amount),
            platformCommission: Prisma.Decimal(platformCommission),
            freelancerEarns: Prisma.Decimal(freelancerEarns),
            status: PaymentStatus.PENDING,
            stripePaymentIntentId: paymentIntent.id
        }
    })

    return {
        payment,
        clientSecret: paymentIntent.client_secret,
        publishableKey: envConfig.stripe_publishable_key
    }
}

const handleWebhook = async (event: Stripe.Event) => {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    const payment = await prisma.payment.findUnique({
        where: {
            stripePaymentIntentId: paymentIntent.id
        }
    });
    if (!payment) {
        throw new Error("Payment record not found.");
    }

    const expectedAmount = Math.round(
        Number(payment.amount) * 100
    );
    if (paymentIntent.amount !== expectedAmount) {
        throw new Error("Payment amount mismatch.");
    }
    if (paymentIntent.currency !== "usd") {
        throw new Error("Payment currency mismatch.");
    }

    if (event.type === 'payment_intent.succeeded') {
        const contractId = paymentIntent.metadata.contractId;
        if (!contractId) {
            throw new Error("Missing contract ID in payment metadata.");
        }
        if (payment.contractId !== contractId) {
            throw new Error("Payment contract mismatch.");
        }

        await prisma.payment.update({
            where: { stripePaymentIntentId: paymentIntent.id },
            data: {
                status: PaymentStatus.SUCCEEDED
            }
        });
    } else if (event.type === 'payment_intent.payment_failed') {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        await prisma.payment.update({
            where: { stripePaymentIntentId: paymentIntent.id },
            data: {
                status: PaymentStatus.FAILED
            }
        })
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


export const PaymentService = {
    initiatePayment,
    handleWebhook,
    getPayment
}