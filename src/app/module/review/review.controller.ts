import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { IRequestUser } from "../auth/auth.interface";
import { ReviewService } from "./review.service";
import { CreateReviewSchema } from "./review.validation";

const createReview = catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IRequestUser;
    const payload = CreateReviewSchema.parse(req.body);

    const result = await ReviewService.createReview(payload, user.userId);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Review created",
        data: result
    });
});

const getFreelancerReviews = catchAsync(async (req: Request, res: Response) => {
    const { freelancerId } = req.params;

    const result = await ReviewService.getFreelancerReviews(freelancerId as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Reviews fetched",
        data: result
    });
});

const getClientReviews = catchAsync(async (req: Request, res: Response) => {
    const { clientId } = req.params;

    const result = await ReviewService.getClientReviews(clientId as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Reviews fetched",
        data: result
    });
});

export const ReviewController = {
    createReview,
    getFreelancerReviews,
    getClientReviews
};