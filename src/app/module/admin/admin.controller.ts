import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync"
import { AdminService } from "./admin.service"
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from 'http-status'

const getUsers = catchAsync(async (req: Request, res: Response) => {
    const result = await AdminService.getUsers();

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Users fetched successfully",
        data: result
    })
})

const blockUser = catchAsync(async (req: Request, res: Response) => {
    const userId = req.params.userId;
    const reason = req.body;
    const blocked = AdminService.blockUser(userId as string, reason)

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Users blocked successfully",
        data: blocked
    })
})

const unblockUser = catchAsync(async (req: Request, res: Response) => {
    const userId = req.params.userId;
    const reason = req.body;
    const unblocked = AdminService.blockUser(userId as string, reason)

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Users unblocked successfully",
        data: unblocked
    })
})

const getDashboard = catchAsync(async (req: Request, res: Response) => {
    const stats = await AdminService.getDashboard()

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Dashboard stats fetched successfuly.",
        data: stats
    })
})

const getAuditLogs = catchAsync(async (req: Request, res: Response) => {
    const stats = await AdminService.getAuditLogs()

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Audit lgos fetched successfuly.",
        data: stats
    })
})



export const AdminController = {
    getUsers,
    blockUser,
    unblockUser,
    getDashboard,
    getAuditLogs
}
