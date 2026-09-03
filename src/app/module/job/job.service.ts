import { Prisma } from "../../../generated/prisma/client";
import { JobStatus } from "../../../generated/prisma/enums";
import { JobOrderByWithRelationInput } from "../../../generated/prisma/models";
import { prisma } from "../../lib/prisma";
import { IJobFilters, IPaginationMeta } from "./job.interface";
import { ICreateJobPayload, IUpdateJobPayload } from "./job.validation";

const createJob = async (payload: ICreateJobPayload, clientId: string,) => {
    const job = await prisma.job.create({
        data: {
            ...payload,
            clientId,
            deadline: new Date(payload.deadline),
        },
        include: {
            client: {
                omit: { password: true }
            }
        }
    })

    return job;
}

const deleteJob = async (jobId: string, clientId: string) => {
    const job = await prisma.job.findUnique({
        where: { id: jobId }
    })

    if (!job) {
        throw new Error("Job Not Found")
    }

    if (job.clientId !== clientId) {
        throw new Error(`You do not have permission for this action.`)
    }

    const deleted = await prisma.job.update({
        where: { id: jobId },
        data: {
            deletedAt: new Date(),
            status: JobStatus.CANCELLED
        }
    })

    return deleted;
}

const closeJob = async (jobId: string, clientId: string) => {
    const job = await prisma.job.findUnique({
        where: { id: jobId }
    })

    if (!job) {
        throw new Error(`No such job found.`)
    }
    if (job.clientId !== clientId) {
        throw new Error(`You do not have permission to perform this action.`)
    }

    const closed = await prisma.job.update({
        where: { id: jobId },
        data: {
            status: JobStatus.CLOSED
        }
    })

    return closed;
}

const getJobsList = async (filters: IJobFilters) => {
    const {
        status = JobStatus.OPEN,
        skills,
        budgetMax,
        budgetMin,
        sortBy = "createdAt",
        page = 1,
        limit = 20,
    } = filters

    const skip = (page - 1) * limit

    const where: Prisma.JobWhereInput = {
        status,
        deletedAt: null,
        deadline: {
            gt: new Date(),
        }
    }

    if (skills && skills.length > 0) {
        where.requiredSkills = {
            hasSome: skills
        }
    }

    if (budgetMin) {
        where.budgetMax = {
            gte: budgetMin
        }
    }
    if (budgetMax) {
        where.budgetMin = {
            lte: budgetMax
        }
    }

    let orderBy: JobOrderByWithRelationInput = { createdAt: 'desc' }
    if (sortBy === 'deadline') {
        orderBy = { deadline: 'asc' }
    }
    else if (sortBy === 'budgetMax') {
        orderBy = { budgetMax: 'desc' }
    }

    const total = await prisma.job.count({ where })

    const jobs = await prisma.job.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
            client: {
                omit: { password: true },
                select: {
                    id: true,
                    name: true,
                    profileImageUrl: true
                }
            }
        }
    })

    const pagination: IPaginationMeta = {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
    }

    return {
        jobs,
        pagination
    }
}

const getJobById = async (jobId: string) => {
    const job = await prisma.job.findUnique({
        where: { id: jobId, deletedAt: null },
        include: {
            client: {
                omit: { password: true }
            }
        }
    })

    if (!job) {
        throw new Error(`Job not found.`)
    }

    return job;
}

const getMyPostedJobs = async (clientId: string, filters: Partial<IJobFilters>) => {
    const { status, page = 1, limit = 20, sortBy = 'createdAt' } = filters;
    const skip = (page - 1) * limit

    const where: Prisma.JobWhereInput = {
        clientId,
        deletedAt: null,
    }

    if (status) {
        where.status = status
    }

    let orderBy: Prisma.JobOrderByWithAggregationInput = { createdAt: 'desc' }
    if (sortBy === 'deadline') {
        orderBy = {
            deadline: 'asc'
        }
    }

    const total = await prisma.job.count({ where })
    const jobs = await prisma.job.findMany({
        where,
        skip,
        take: limit,
        orderBy
    })

    const pagination: IPaginationMeta = {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
    }

    return { jobs, pagination }
}

const updateJob = async (jobId: string, payload: IUpdateJobPayload, clientId: string) => {
    const job = await prisma.job.findUnique({
        where: { id: jobId }
    })

    if (!job) {
        throw new Error(`Job not found`)
    }
    if (job.clientId !== clientId) {
        throw new Error(`You do not have permission to do this action.`)
    }
    if (job.status !== JobStatus.OPEN) {
        throw new Error(`Can only update open jobs.`)
    }

    const updated = await prisma.job.update({
        where: { id: jobId },
        data: {
            ...payload,
            deadline: payload.deadline ? new Date(payload.deadline) : undefined
        },
        include: {
            client: {
                omit: { password: true }
            }
        }
    })

    return updated;
}

export const JobService = {
    createJob,
    deleteJob,
    getJobsList,
    getJobById,
    closeJob,
    getMyPostedJobs,
    updateJob
}