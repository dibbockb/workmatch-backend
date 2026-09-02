import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { IRequestUser } from "../auth/auth.interface";
import { CreateJobValidationSchema } from "./job.validation";
import { JobService } from "./job.service";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from 'http-status'

const createJob = catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IRequestUser
    const validatedPayload = CreateJobValidationSchema.parse(req.body)

    const result = await JobService.createJob(validatedPayload, user.userId)

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Job Created Successfully.",
        data: result
    })
})

const deleteJob = catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IRequestUser
    const { id } = req.params

    await JobService.deleteJob(id as string, user.userId)

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Job deleted successfully',
        data: null,
    })
})

export const JobController = {
    createJob,
    deleteJob
}