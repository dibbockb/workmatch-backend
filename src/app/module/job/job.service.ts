import httpStatus from "http-status";
import { Prisma } from "../../../generated/prisma/client";
import { JobStatus } from "../../../generated/prisma/enums";
import { JobOrderByWithRelationInput } from "../../../generated/prisma/models";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { IJobFilters, IPaginationMeta } from "./job.interface";
import { ICreateJobPayload, IUpdateJobPayload } from "./job.validation";

const createJob = async (payload: ICreateJobPayload, clientId: string) => {
	const job = await prisma.job.create({
		data: {
			...payload,
			clientId,
			deadline: new Date(payload.deadline),
		},
		include: {
			client: {
				omit: { password: true },
			},
		},
	});

	return job;
};

const deleteJob = async (jobId: string, clientId: string) => {
	const job = await prisma.job.findUnique({
		where: { id: jobId },
	});

	if (!job) {
		throw new AppError(httpStatus.NOT_FOUND, "Job Not Found");
	}

	if (job.clientId !== clientId) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			`You do not have permission for this action.`,
		);
	}

	const deleted = await prisma.job.update({
		where: { id: jobId },
		data: {
			deletedAt: new Date(),
			status: JobStatus.CANCELLED,
		},
	});

	return deleted;
};

const closeJob = async (jobId: string, clientId: string) => {
	const job = await prisma.job.findUnique({
		where: { id: jobId },
	});

	if (!job) {
		throw new AppError(httpStatus.NOT_FOUND, `No such job found.`);
	}
	if (job.clientId !== clientId) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			`You do not have permission to perform this action.`,
		);
	}

	const closed = await prisma.job.update({
		where: { id: jobId },
		data: {
			status: JobStatus.CLOSED,
		},
	});

	return closed;
};

const getJobsList = async (filters: IJobFilters) => {
	const {
		status = JobStatus.OPEN,
		skills,
		budgetMax,
		budgetMin,
		search,
		sortBy = "createdAt",
		page = 1,
	} = filters;

	const parsedPage = Number(page) || 1;
	const parsedLimit = Number(filters.limit) || 10;

	const skip = (parsedPage - 1) * parsedLimit;

	const parsedBudgetMin = budgetMin !== undefined ? Number(budgetMin) : undefined;
	const parsedBudgetMax = budgetMax !== undefined ? Number(budgetMax) : undefined;

	const parsedSkills = typeof skills === "string"
		? (skills as string).split(",").map((s) => s.trim()).filter(Boolean)
		: skills;

	const where: Prisma.JobWhereInput = {
		status,
		deletedAt: null,
		deadline: {
			gt: new Date(),
		},
	};

	if (parsedSkills && parsedSkills.length > 0) {
		where.requiredSkills = {
			hasSome: parsedSkills,
		};
	}

	if (parsedBudgetMin !== undefined && !Number.isNaN(parsedBudgetMin)) {
		where.budgetMax = {
			gte: parsedBudgetMin,
		};
	}
	if (parsedBudgetMax !== undefined && !Number.isNaN(parsedBudgetMax)) {
		where.budgetMin = {
			lte: parsedBudgetMax,
		};
	}

	if (search && search.trim()) {
		const sanitizedSearch = search.trim();
		where.OR = [
			{ title: { contains: sanitizedSearch, mode: "insensitive" } },
			{ description: { contains: sanitizedSearch, mode: "insensitive" } },
		];
	}

	let orderBy: Prisma.JobOrderByWithRelationInput = { createdAt: "desc" };
	if (sortBy === "deadline") {
		orderBy = { deadline: "asc" };
	} else if (sortBy === "budgetMax") {
		orderBy = { budgetMax: "desc" };
	}

	const [total, jobs] = await Promise.all([
		prisma.job.count({ where }),
		prisma.job.findMany({
			where,
			skip,
			take: parsedLimit,
			orderBy,
			include: {
				client: {
					select: {
						id: true,
						name: true,
						profileImageUrl: true,
					},
				},
			},
		}),
	]);

	const totalPages = total > 0 ? Math.ceil(total / parsedLimit) : 0;

	return {
		jobs,
		pagination: {
			page: parsedPage,
			limit: parsedLimit,
			total,
			totalPages,
		},
	};
};

const getJobById = async (jobId: string) => {
	const job = await prisma.job.findUnique({
		where: { id: jobId, deletedAt: null },
		include: {
			client: {
				omit: { password: true },
			},
		},
	});

	if (!job) {
		throw new AppError(httpStatus.NOT_FOUND, `Job not found.`);
	}

	return job;
};

const getMyPostedJobs = async (
	clientId: string,
	filters: Partial<IJobFilters>,
) => {
	const { status, page = 1, limit = 20, sortBy = "createdAt" } = filters;
	const skip = (page - 1) * limit;

	const where: Prisma.JobWhereInput = {
		clientId,
		deletedAt: null,
	};

	if (status) {
		where.status = status;
	}

	let orderBy: Prisma.JobOrderByWithAggregationInput = { createdAt: "desc" };
	if (sortBy === "deadline") {
		orderBy = {
			deadline: "asc",
		};
	}

	const total = await prisma.job.count({ where });
	const jobs = await prisma.job.findMany({
		where,
		skip,
		take: limit,
		orderBy,
	});

	const pagination: IPaginationMeta = {
		page,
		limit,
		total,
		totalPages: Math.ceil(total / limit),
	};

	return { jobs, pagination };
};

const updateJob = async (
	jobId: string,
	payload: IUpdateJobPayload,
	clientId: string,
) => {
	const job = await prisma.job.findUnique({
		where: { id: jobId },
	});

	if (!job) {
		throw new AppError(httpStatus.NOT_FOUND, `Job not found`);
	}
	if (job.clientId !== clientId) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			`You do not have permission to do this action.`,
		);
	}
	if (job.status !== JobStatus.OPEN) {
		throw new AppError(httpStatus.CONFLICT, `Can only update open jobs.`);
	}

	if (payload.budgetMax && payload.budgetMin) {
		const newMin = payload.budgetMin ?? job.budgetMin;
		const newMax = payload.budgetMax ?? job.budgetMax;

		if (newMax < newMin) {
			throw new AppError(
				httpStatus.BAD_REQUEST,
				"Maximum budget cannot be less than minimum budget.",
			);
		}
	}

	const updated = await prisma.job.update({
		where: { id: jobId },
		data: {
			...payload,
			deadline: payload.deadline ? new Date(payload.deadline) : undefined,
		},
		include: {
			client: {
				omit: { password: true },
			},
		},
	});

	return updated;
};

export const JobService = {
	createJob,
	deleteJob,
	getJobsList,
	getJobById,
	closeJob,
	getMyPostedJobs,
	updateJob,
};
