import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { IRequestUser } from "../auth/auth.interface";
import { PaymentService } from "./payment.service";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";
import Stripe from "stripe";
import { stripe } from "../../lib/stripe";

const initiatePayment = catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IRequestUser;
    const { contractId } = req.body;

    const result = await PaymentService.initiatePayment(contractId, user.userId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Payment initiated",
        data: result
    });
});

const handleWebhook = catchAsync(async (req: Request, res: Response) => {
    const sig = req.headers["stripe-signature"] as string;

    let event: Stripe.Event;
    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET || ""
        );
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err}`);
    }

    await PaymentService.handleWebhook(event);

    res.json({ received: true });
});

const getPayment = catchAsync(async (req: Request, res: Response) => {
    const { paymentId } = req.params;

    const result = await PaymentService.getPayment(paymentId as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Payment fetched successfully",
        data: result
    });
});


export const PaymentController = {
    initiatePayment,
    handleWebhook,
    getPayment
}