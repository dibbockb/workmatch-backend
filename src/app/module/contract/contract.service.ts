import { ContractStatus, JobStatus, ProposalStatus, UserRoles } from "../../../generated/prisma/enums"
import { prisma } from "../../lib/prisma"

const acceptProposal = async (jobId: string, proposalId: string, clientId: string) => {
    return await prisma.$transaction(async (tx) => {
        const proposal = await tx.proposal.findUnique({
            where: { id: proposalId },
            include: { job: true }
        })

        if (!proposal) {
            throw new Error(`Proposal Not Found`)
        }
        if (proposal.jobId !== jobId) {
            throw new Error(`Proposal does not belong to this job.`)
        }
        if (proposal.job.clientId !== clientId) {
            throw new Error(`You do not have permission to accept this proposal`)
        }
        if (proposal.status !== ProposalStatus.PENDING) {
            throw new Error(`Proposal is no longer pending`)
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

        await tx.job.update({
            where: { id: jobId },
            data: { status: JobStatus.IN_PROGRESS }
        })

        return contract;
    })
}

const getContract = async (contractId: string) => {
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
        throw new Error(`Contract Not Found`)
    }

    return contract;
}

const getMyContracts = async (userId: string, role: string) => {
    const where: any = { deletedAt: null };

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
        orderBy: { createdAt: 'desc' }
    })

    return contracts;
}

const markAsComplete = async (contractId: string, userId: string) => {
    const contract = await prisma.contract.findUnique({
        where: { id: contractId }
    })

    if (!contract) {
        throw new Error(`Contract not found.`)
    }
    if (contract.clientId !== userId) {
        throw new Error(`Only client can mark contract as complete.`)
    }

    const completed = await prisma.contract.update({
        where: { id: contractId },
        data: {
            status: ContractStatus.COMPLETED,
            endDate: new Date(),
        }
    })

    return completed;
}

export const ContractService = {
    acceptProposal,
    getContract,
    getMyContracts,
    markAsComplete
}