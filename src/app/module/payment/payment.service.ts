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
    if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const contractId = paymentIntent.metadata.contractId;

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

const getPayment = async (paymentId: string) => {
    const payment = await prisma.payment.findUnique({
        where: { id: paymentId }
    })

    if (!payment) {
        throw new Error(`Payment not found.`)
    }

    return payment;
}


export const PaymentService = {
    initiatePayment,
    handleWebhook,
    getPayment
}