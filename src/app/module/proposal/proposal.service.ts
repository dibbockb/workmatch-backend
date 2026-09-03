import { Prisma } from "../../../generated/prisma/client";
import { JobStatus, ProposalStatus } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { IJobFilters } from "../job/job.interface";
import { ICreateProposalPayload } from "./proposal.validation";

const submitProposal = async (payload: ICreateProposalPayload, freelancerId: string) => {
    const { jobId, proposedPrice, proposedTimeline, approachDescription } = payload
    const job = await prisma.job.findUnique({
        where: { id: jobId }
    })

    if (!job) {
        throw new Error(`No job found.`)
    }
    if (job.status !== JobStatus.OPEN) {
        throw new Error(`This job is no longer open for proposals.`)
    }
    if (new Date(job.deadline) < new Date()) {
        throw new Error(`Deadline has passed.`)
    }

    const existingProposal = await prisma.proposal.findUnique({
        where: {
            jobId_freelancerId: {
                jobId,
                freelancerId
            }
        }
    })

    if (existingProposal) {
        throw new Error(`You have already submitted a proposal for this gig.`)
    }
    if (job.clientId === freelancerId) {
        throw new Error(`You can not submit a proposal for the job you posted yourself.`)
    }

    const [proposal, updatedJob] = await prisma.$transaction(async (tx) => {
        const newProposal = await tx.proposal.create({
            data: {
                jobId,
                freelancerId,
                proposedPrice,
                proposedTimeline,
                approachDescription,
                status: ProposalStatus.PENDING
            },
            include: {
                freelancer: {
                    select: {
                        id: true,
                        name: true,
                        profileImageUrl: true
                    }
                },
                counterOffers: {
                    orderBy: { createdAt: 'desc' }
                }
            }
        })

        const job = await tx.job.update({
            where: { id: jobId },
            data: {
                proposalCount: {
                    increment: 1
                }
            }
        })
        return [newProposal, job]
    })
}

const getProposals = async (jobId: string, filters: IJobFilters) => {
    const { page = 1, limit = 50, sortBy = 'submittedAt' } = filters
    const skip = (page - 1) * limit
    const job = await prisma.job.findUnique({
        where: { id: jobId }
    })

    if (!job) {
        throw new Error(`Job Not Found.`)
    }

    let orderBy: Prisma.ProposalOrderByWithRelationInput = { submittedAt: "desc" };
    if (sortBy === "proposedPrice") {
        orderBy = { proposedPrice: "asc" };
    }
    const total = await prisma.proposal.count({
        where: { jobId, status: ProposalStatus.PENDING }
    })

    const proposals = await prisma.proposal.findMany({
        where: {
            jobId,
            status: {
                in: [ProposalStatus.PENDING, ProposalStatus.ACCEPTED]
            }
        },
        skip,
        take: limit,
        orderBy,
        include: {
            freelancer: {
                select: {
                    id: true,
                    name: true,
                    profileImageUrl: true
                }
            },
            counterOffers: {
                orderBy: { createdAt: 'desc' }
            }
        },
    })

    return {
        proposals,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    }
}


export const ProposalService = {
    submitProposal,
    getProposals
}