import { Request, Response } from "express";
import httpStatus from "http-status";
import { AppError } from "../../utils/AppError";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { IRequestUser } from "../auth/auth.interface";
import { IJobFilters } from "./job.interface";
import { JobService } from "./job.service";
import {
	CreateJobValidationSchema,
	UpdateJobValidationSchema,
} from "./job.validation";

const createJob = catchAsync(async (req: Request, res: Response) => {
	const user = req.user as IRequestUser;
	const validatedPayload = CreateJobValidationSchema.parse(req.body);

	const result = await JobService.createJob(validatedPayload, user.userId);

	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: "Job Created Successfully.",
		data: result,
	});
});

const deleteJob = catchAsync(async (req: Request, res: Response) => {
	const user = req.user as IRequestUser;
	const jobId = req.params.jobId;

	await JobService.deleteJob(jobId as string, user.userId);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Job deleted successfully",
		data: null,
	});
});

const getJobsList = catchAsync(async (req: Request, res: Response) => {
	const { status, skills, budgetMin, budgetMax, sortBy, page, limit, q } =
		req.query;

	const filters = {
		status: status as any,
		skills: skills ? (Array.isArray(skills) ? skills : [skills]) : undefined,
		budgetMin: budgetMin ? Number(budgetMin) : undefined,
		budgetMax: budgetMax ? Number(budgetMax) : undefined,
		search: q as string | undefined,
		sortBy: (sortBy as any) || "createdAt",
		page: page ? Number(page) : 1,
		limit: limit ? Number(limit) : 20,
	};

	const result = await JobService.getJobsList(filters as IJobFilters);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Jobs fetched successfully",
		data: result,
	});
});

const getJobById = catchAsync(async (req: Request, res: Response) => {
	const { jobId } = req.params;

	const result = await JobService.getJobById(jobId as string);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Job fetched successfully",
		data: result,
	});
});

const updateJob = catchAsync(async (req: Request, res: Response) => {
	const user = req.user as IRequestUser;
	const { jobId } = req.params;
	const validatedPayload = UpdateJobValidationSchema.parse(req.body);

	const result = await JobService.updateJob(
		jobId as string,
		validatedPayload,
		user.userId,
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Job updated successfully",
		data: result,
	});
});

const closeJob = catchAsync(async (req: Request, res: Response) => {
	const user = req.user as IRequestUser;
	const { jobId } = req.params;

	const result = await JobService.closeJob(jobId as string, user.userId);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Job closed successfully",
		data: result,
	});
});

const getMyPostedJobs = catchAsync(async (req: Request, res: Response) => {
	const user = req.user as IRequestUser;
	const { status, page, limit, sortBy } = req.query;

	const filters = {
		status: status as any,
		page: page ? Number(page) : 1,
		limit: limit ? Number(limit) : 20,
		sortBy: (sortBy as any) || "createdAt",
	};

	const result = await JobService.getMyPostedJobs(user.userId, filters);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Your jobs fetched successfully",
		data: result,
	});
});

const searchJobs = catchAsync(async (req: Request, res: Response) => {
	const { q, page, limit } = req.query;

	if (!q || !(q as string).trim()) {
		throw new AppError(httpStatus.BAD_REQUEST, "Search query 'q' is required");
	}

	const filters: IJobFilters = {
		search: q as string,
		page: page ? Number(page) : 1,
		limit: limit ? Number(limit) : 20,
	};

	const result = await JobService.getJobsList(filters);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Search results fetched successfully",
		data: result,
	});
});

export const JobController = {
	createJob,
	deleteJob,
	getJobsList,
	getJobById,
	closeJob,
	updateJob,
	getMyPostedJobs,
	searchJobs,
};
