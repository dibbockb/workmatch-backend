import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { IRequestUser } from "../auth/auth.interface";
import { ProposalService } from "./proposal.service";
import {
    CreateProposalValidationSchema,
    CreateCounterOfferValidationSchema,
} from "./proposal.validation";

const submitProposal = catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IRequestUser;
    const validatedPayload = CreateProposalValidationSchema.parse(req.body);

    const result = await ProposalService.submitProposal(validatedPayload, user.userId);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Proposal submitted successfully",
        data: result,
    });
});

const getProposalsForJob = catchAsync(async (req: Request, res: Response) => {
    const { jobId } = req.params;
    const { page, limit, sortBy } = req.query;

    const filters = {
        jobId,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 50,
        sortBy: (sortBy as any) || "submittedAt",
    };

    const result = await ProposalService.getProposals(jobId as string, filters);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Proposals fetched successfully",
        data: result,
    });
});

const getProposalById = catchAsync(async (req: Request, res: Response) => {
    const { proposalId } = req.params;

    const result = await ProposalService.getProposalById(proposalId as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Proposal fetched successfully",
        data: result,
    });
});

const getFreelancerProposals = catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IRequestUser;
    const { status, page, limit, sortBy } = req.query;

    const filters = {
        status: status as any,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20,
        sortBy: (sortBy as any) || "submittedAt",
    };

    const result = await ProposalService.getFreelancerProposals(user.userId, filters);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Your proposals fetched successfully",
        data: result,
    });
});

const withdrawProposal = catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IRequestUser;
    const { proposalId } = req.params;

    const result = await ProposalService.withdrawProposal(proposalId as string, user.userId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Proposal withdrawn successfully",
        data: result,
    });
});

const createCounterOffer = catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IRequestUser;
    const { proposalId } = req.params;
    const validatedPayload = CreateCounterOfferValidationSchema.parse(req.body);

    const result = await ProposalService.createCounterOffer(
        proposalId as string,
        user.userId,
        validatedPayload
    );

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Counter-offer created successfully",
        data: result,
    });
});

const acceptCounterOffer = catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IRequestUser;
    const { counterOfferId } = req.params;

    const result = await ProposalService.acceptCounterOffer(counterOfferId as string, user.userId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Counter-offer accepted successfully",
        data: result,
    });
});

const rejectCounterOffer = catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IRequestUser;
    const { counterOfferId } = req.params;

    const result = await ProposalService.rejectCounterOffer(counterOfferId as string, user.userId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Counter-offer rejected successfully",
        data: result,
    });
});


export const ProposalController = {
    submitProposal,
    getProposalsForJob,
    getProposalById,
    getFreelancerProposals,
    withdrawProposal,
    createCounterOffer,
    acceptCounterOffer,
    rejectCounterOffer,
};