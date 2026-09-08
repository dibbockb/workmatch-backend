import { prisma } from "../../lib/prisma"
import { logAction } from "../../utils/autditlog";
import { ICreateReviewPayload } from "./review.validation";

const createReview = async (payload: ICreateReviewPayload, reviewerId: string) => {
    const { contractId, rating, comment } = payload;

    const contract = await prisma.contract.findUnique({
        where: { id: contractId }
    });

    if (!contract) throw new Error("Contract not found");
    if (contract.status !== "COMPLETED") throw new Error("Contract is not completed yet.");

    const revieweeId = reviewerId === contract.clientId ? contract.freelancerId : contract.clientId;

    if (reviewerId !== contract.clientId && reviewerId !== contract.freelancerId) {
        throw new Error("Only client or freelancer can review");
    }

    const review = await prisma.review.create({
        data: { contractId, reviewerId, revieweeId, rating, comment },
        include: { reviewer: { omit: { password: true } } }
    });

    await logAction(reviewerId, "REVIEW_CREATED", "Review", review.id);

    return review;
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