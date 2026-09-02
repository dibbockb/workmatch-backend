import { JobStatus } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { ICreateJobPayload } from "./job.validation";

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

export const JobService = {
    createJob,
    deleteJob
}