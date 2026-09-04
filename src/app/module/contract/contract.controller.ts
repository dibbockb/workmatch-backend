import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { IRequestUser } from "../auth/auth.interface";
import { ContractService } from "./contract.service";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";

const acceptProposal = catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IRequestUser;
    const { jobId, proposalId } = req.body;

    const result = await ContractService.acceptProposal(jobId, proposalId, user.userId);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Proposal accepted and contract created",
        data: result
    });
});

const getContract = catchAsync(async (req: Request, res: Response) => {
    const { contractId } = req.params;
    const user = req.user as IRequestUser;

    const result = await ContractService.getContract(contractId as string, user.userId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Contract fetched successfully",
        data: result
    });
});

const getMyContracts = catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IRequestUser;
    const result = await ContractService.getMyContracts(user.userId, user.role);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Your contracts fetched successfully",
        data: result
    });
});

const markAsComplete = catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IRequestUser;
    const { contractId } = req.params;

    const result = await ContractService.markAsComplete(contractId as string, user.userId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Contract marked as complete",
        data: result
    });
});

export const ContractController = {
    acceptProposal,
    getContract,
    getMyContracts,
    markAsComplete
}