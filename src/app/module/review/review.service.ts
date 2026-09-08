import { Prisma } from "../../../generated/prisma/client";
import { ContractStatus } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma"
import { logAction } from "../../utils/autditlog";
import { ICreateReviewPayload } from "./review.validation";

const createReview = async (payload: ICreateReviewPayload, reviewerId: string) => {
    const { contractId, rating, comment } = payload;

    const contract = await prisma.contract.findUnique({
        where: { id: contractId }
    });

    if (!contract) throw new Error("Contract not found");
    if (contract.status !== ContractStatus.COMPLETED) throw new Error("Contract is not completed yet.");

    const revieweeId = reviewerId === contract.clientId ? contract.freelancerId : contract.clientId;

    if (reviewerId !== contract.clientId && reviewerId !== contract.freelancerId) {
        throw new Error("Only client or freelancer can review");
    }

    return await prisma.$transaction(async (tx) => {
        const review = await tx.review.create({
            data: { contractId, reviewerId, revieweeId, rating, comment }
        });

        const reviews = await tx.review.findMany({
            where: { revieweeId }
        });
        const avgRating = reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : 0;

        await tx.user.update({
            where: { id: revieweeId },
            data: { averageRating: new Prisma.Decimal(avgRating) }
        });
        await logAction(reviewerId, "REVIEW_CREATED", "Review", review.id);

        return review;
    });
};

const getFreelancerReviews = async (freelancerId: string) => {
    return await prisma.review.findMany({
        where: { revieweeId: freelancerId },
        include: { reviewer: { omit: { password: true } } }
    });
};

const getClientReviews = async (clientId: string) => {
    return await prisma.review.findMany({
        where: { revieweeId: clientId },
        include: { reviewer: { omit: { password: true } } }
    });
};

export const ReviewService = {
    createReview,
    getFreelancerReviews,
    getClientReviews
}