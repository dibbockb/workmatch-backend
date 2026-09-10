import { Prisma, PrismaClient } from "../../../generated/prisma/client"
import { ContractStatus, JobStatus, ProposalStatus, UserRoles } from "../../../generated/prisma/enums"
import { prisma } from "../../lib/prisma"
import { logAction } from "../../utils/auditlog"
import { AppError } from "../../utils/AppError"
import httpStatus from "http-status"

const acceptProposal = async (jobId: string, proposalId: string, clientId: string) => {
    return await prisma.$transaction(async (tx) => {
        const proposal = await tx.proposal.findUnique({
            where: { id: proposalId },
            include: { job: true }
        })

        if (!proposal) {
            throw new AppError(httpStatus.NOT_FOUND, `Proposal Not Found`)
        }
        if (proposal.jobId !== jobId) {
            throw new AppError(httpStatus.FORBIDDEN, `Proposal does not belong to this job.`)
        }
        if (proposal.job.clientId !== clientId) {
            throw new AppError(httpStatus.FORBIDDEN, `You do not have permission to accept this proposal`)
        }
        if (proposal.status !== ProposalStatus.PENDING) {
            throw new AppError(httpStatus.CONFLICT, `Proposal is no longer pending`)
        }
        if (proposal.job.status !== JobStatus.OPEN) {
            throw new AppError(httpStatus.CONFLICT, "This job is no longer open.");
        }
        if (proposal.job.deadline <= new Date()) {
            throw new AppError(httpStatus.CONFLICT, "The job deadline has passed.");
        }

        await tx.proposal.updateMany({
            where: {
                jobId,
                id: { not: proposalId }
            },
            data: {
                status: ProposalStatus.REJECTED
            }
        });

        await tx.proposal.update({
            where: { id: proposalId },
            data: {
                status: ProposalStatus.ACCEPTED
            }
        })

        const contract = await tx.contract.create({
            data: {
                jobId,
                proposalId,
                clientId,
                freelancerId: proposal.freelancerId,
                agreedPrice: proposal.proposedPrice,
                agreedTimeline: proposal.proposedTimeline,
                status: ContractStatus.ACTIVE
            },
            include: {
                job: true,
                proposal: true,
                client: { omit: { password: true } },
                freelancer: { omit: { password: true } },
            }
        })

        await logAction(tx, clientId, "CONTRACT_ACCEPTED", "CONTRACT", contract.id);

        await tx.job.update({
            where: { id: jobId },
            data: { status: JobStatus.IN_PROGRESS }
        })

        return contract;
    })
}

const getContract = async (contractId: string, userId: string, role: string) => {
    const contract = await prisma.contract.findUnique({
        where: { id: contractId },
        include: {
            job: true,
            proposal: true,
            client: { omit: { password: true } },
            freelancer: { omit: { password: true } },
            payments: true
        }
    });

    if (!contract) {
        throw new AppError(httpStatus.NOT_FOUND, `Contract Not Found`)
    }
    if (
        role !== UserRoles.ADMIN &&
        contract.clientId !== userId &&
        contract.freelancerId !== userId
    ) {
        throw new AppError(httpStatus.FORBIDDEN, "You do not have permission to view this contract.");
    }

    return contract;
}

const getMyContracts = async (userId: string, role: string) => {
    const where: Prisma.ContractWhereInput = { deletedAt: null };

    if (role === UserRoles.CLIENT) {
        where.clientId = userId;
    } else {
        where.freelancerId = userId;
    }

    const contracts = await prisma.contract.findMany({
        where,
        include: {
            job: true,
            proposal: true,
            client: { omit: { password: true } },
            freelancer: { omit: { password: true } },
            payments: true
        },
        orderBy: { createdAt: 'desc' },
    })

    return contracts;
}

const markAsComplete = async (contractId: string, userId: string) => {
    const complete = await prisma.$transaction(async (tx) => {
        const contract = await tx.contract.findUnique({
            where: { id: contractId }
        });

        if (!contract) {
            throw new AppError(httpStatus.NOT_FOUND, "Contract not found.");
        }
        if (contract.clientId !== userId) {
            throw new AppError(httpStatus.FORBIDDEN, "Only client can mark contract as complete.");
        }
        if (contract.status !== ContractStatus.ACTIVE) {
            throw new AppError(httpStatus.CONFLICT, "Only active contracts can be completed.");
        }

        const completedContract = await tx.contract.update({
            where: { id: contractId },
            data: {
                status: ContractStatus.COMPLETED,
                endDate: new Date(),
            }
        });
        await tx.job.update({
            where: { id: contract.jobId },
            data: {
                status: JobStatus.COMPLETED
            }
        });

        return completedContract;
    });

    return complete;
}

export const ContractService = {
    acceptProposal,
    getContract,
    getMyContracts,
    markAsComplete
}