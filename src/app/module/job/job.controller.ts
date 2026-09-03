import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { IRequestUser } from "../auth/auth.interface";
import { CreateJobValidationSchema, UpdateJobValidationSchema } from "./job.validation";
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

const getJobsList = catchAsync(async (req: Request, res: Response) => {
    const { status, skills, budgetMin, budgetMax, sortBy, page, limit } = req.query

    const filters = {
        status: status as any,
        // skills: skills ? (Array.isArray(skills) ? skills : [skills]) : undefined,
        budgetMin: budgetMin ? Number(budgetMin) : undefined,
        budgetMax: budgetMax ? Number(budgetMax) : undefined,
        sortBy: (sortBy as any) || 'createdAt',
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20,
    }

    const result = await JobService.getJobsList(filters)

})

const getJobById = catchAsync(async (req: Request, res: Response) => {
    const { jobId } = req.params;

    const result = await JobService.getJobById(jobId as string)

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Job fetched successfully",
        data: result
    })
})

const updateJob = catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IRequestUser
    const { jobId } = req.params
    const validatedPayload = UpdateJobValidationSchema.parse(req.body)

    const result = await JobService.updateJob(jobId as string, validatedPayload, user.userId)

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Job updated successfully',
        data: result,
    })
})

const closeJob = catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IRequestUser
    const { jobId } = req.params

    const result = await JobService.closeJob(jobId as string, user.userId)

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Job closed successfully',
        data: result,
    })
})

const getMyPostedJobs = catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IRequestUser
    const { status, page, limit, sortBy } = req.query

    const filters = {
        status: status as any,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20,
        sortBy: (sortBy as any) || 'createdAt',
    }

    const result = await JobService.getMyPostedJobs(user.userId, filters)

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Your jobs fetched successfully',
        data: result,
    })
})

export const JobController = {
    createJob,
    deleteJob,
    getJobsList,
    getJobById,
    closeJob,
    updateJob,
    getMyPostedJobs
}