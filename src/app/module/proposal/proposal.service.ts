import { Prisma } from "../../../generated/prisma/client";
import { CounterOfferOrigin, CounterOfferStatus, JobStatus, ProposalStatus } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { IJobFilters } from "../job/job.interface";
import { ICounterOfferResponse, IProposalFilters } from "./proposal.interface";
import { ICreateCounterOfferPayload, ICreateProposalPayload } from "./proposal.validation";

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
        const existing = await tx.proposal.findUnique({
            where: { jobId_freelancerId: { jobId, freelancerId } }
        });
        if (existing) throw new Error("Already proposed");

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

const getProposals = async (jobId: string, filters: IJobFilters, clientId: string) => {
    const { page = 1, limit = 50, sortBy = 'submittedAt' } = filters
    const skip = (page - 1) * limit
    const job = await prisma.job.findUnique({
        where: { id: jobId, deletedAt: null }
    })

    if (!job) {
        throw new Error(`Job Not Found.`)
    }
    if (job.clientId !== clientId) {
        throw new Error("You do not have permission to view these proposals.");
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
            },
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

const getProposalById = async (proposalId: string) => {
    const proposal = await prisma.proposal.findUnique({
        where: { id: proposalId },
        include: {
            freelancer: {
                select: {
                    id: true,
                    name: true,
                    profileImageUrl: true
                }
            }
        }
    })

    if (!proposal) {
        throw new Error(`Proposal not found.`)
    }


    return proposal;
}

const getFreelancerProposals = async (freelancerId: string, filters: IProposalFilters) => {
    const { status, page = 1, limit = 20, sortBy = "submittedAt" } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.ProposalWhereInput = {
        freelancerId,
    };
    if (status) {
        where.status = status
    }

    let orderBy: Prisma.ProposalOrderByWithRelationInput = {
        submittedAt: 'desc'
    }
    if (sortBy === "proposedPrice") {
        orderBy = { proposedPrice: "asc" }
    }
    const total = await prisma.proposal.count({
        where
    })

    const proposals = await prisma.proposal.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
            job: true,
            counterOffers: {
                orderBy: {
                    createdAt: 'desc'
                }
            }
        }
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

const withdrawProposal = async (proposalId: string, freelancerId: string) => {
    const proposal = await prisma.proposal.findUnique({
        where: { id: proposalId }
    })

    if (!proposal) {
        throw new Error(`Proposal not found.`)
    }
    if (proposal.freelancerId !== freelancerId) {
        throw new Error(`You do not have permission to withdraw this proposal.`)
    }

    if (proposal.status !== ProposalStatus.PENDING) {
        throw new Error(`You can only withdraw pending proposals`)
    }

    const withdrawn = await prisma.proposal.update({
        where: { id: proposalId },
        data: {
            status: ProposalStatus.WITHDRAWN
        }
    })
    return withdrawn;
}

const createCounterOffer = async (proposalId: string, clientId: string, payload: ICreateCounterOfferPayload) => {
    const counterOffer = await prisma.$transaction(async (tx) => {
        const existingPending = await tx.counterOffer.findFirst({
            where: {
                proposalId,
                status: CounterOfferStatus.PENDING
            }
        });
        if (existingPending) {
            throw new Error("There is already a pending counteroffer for this proposal.");
        }

        const proposal = await prisma.proposal.findUnique({
            where: { id: proposalId },
            include: { job: true }
        })

        if (!proposal) {
            throw new Error(`Proposal Not Found.`)
        }
        if (proposal.job.clientId !== clientId) {
            throw new Error(`You do not have permission to counter offer on this proposal.`)
        }
        if (proposal.status !== ProposalStatus.PENDING) {
            throw new Error(`Cannot create counter offer for non-pending proposals.`)
        }

        if (payload.proposedPrice <= 0) {
            throw new Error("Price must be greater than 0");
        }
        if (!payload.proposedTimeline) {
            throw new Error("Timeline is required");
        }
        if (payload.proposedPrice > 1000000) {
            throw new Error("Price seems unreasonably high");
        }

        const counterOffer = await tx.counterOffer.create({
            data: {
                proposalId,
                offeredBy: CounterOfferOrigin.CLIENT,
                proposedPrice: payload.proposedPrice,
                proposedTimeline: payload.proposedTimeline,
                message: payload.message,
                status: CounterOfferStatus.PENDING,
            },
        });

        return counterOffer;
    });

    return counterOffer;
}

const acceptCounterOffer = async (counterOfferId: string, freelancerId: string) => {
    const accept = await prisma.$transaction(async (tx) => {
        const counterOffer = await tx.counterOffer.findUnique({
            where: { id: counterOfferId },
            include: { proposal: true }
        })

        if (!counterOffer) {
            throw new Error(`Counter offer not found.`)
        }
        if (counterOffer.proposal.freelancerId !== freelancerId) {
            throw new Error(`You do not have permission to accept this offer.`)
        }
        if (counterOffer.status !== CounterOfferStatus.PENDING) {
            throw new Error("Counteroffer has already been responded.");
        }

        const updated = await tx.counterOffer.update({
            where: { id: counterOfferId },
            data: {
                status: CounterOfferStatus.ACCEPTED
            }
        })
        if (counterOffer.offeredBy === CounterOfferOrigin.CLIENT) {
            await tx.proposal.update({
                where: { id: counterOffer.proposalId },
                data: {
                    proposedPrice: counterOffer.proposedPrice,
                    proposedTimeline: counterOffer.proposedTimeline,
                },
            });
        }

        return updated;
    })
    return accept;
}

const rejectCounterOffer = async (counterOfferId: string, freelancerId: string) => {
    const counterOffer = await prisma.counterOffer.findUnique({
        where: { id: counterOfferId },
        include: { proposal: true }
    })

    if (!counterOffer) {
        throw new Error("Counter offer not found");
    }
    if (counterOffer.proposal.freelancerId !== freelancerId) {
        throw new Error(`You do not have permission to reject this offer.`)
    }
    if (counterOffer.status !== CounterOfferStatus.PENDING) {
        throw new Error("Counter offer has already been responded.");
    }

    const updated = await prisma.counterOffer.update({
        where: { id: counterOfferId },
        data: {
            status: CounterOfferStatus.REJECTED,
        },
    });

    return updated;
}

export const ProposalService = {
    submitProposal,
    getProposals,
    getProposalById,
    getFreelancerProposals,
    withdrawProposal,
    createCounterOffer,
    acceptCounterOffer,
    rejectCounterOffer
}