import { ProposalStatus, CounterOfferStatus, CounterOfferOrigin } from "../../../generated/prisma/enums";

export interface IProposalFilters {
    jobId?: string;
    status?: ProposalStatus;
    page?: number;
    limit?: number;
    sortBy?: 'proposedPrice' | 'submittedAt';
}

export interface IProposalResponse {
    id: string;
    jobId: string;
    freelancerId: string;
    freelancer: {
        id: string;
        name: string;
        profileImageUrl?: string;
    };
    proposedPrice: number;
    proposedTimeline: number;
    approachDescription: string;
    status: ProposalStatus;
    counterOffers: ICounterOfferResponse[];
    submittedAt: Date;
}

export interface ICounterOfferResponse {
    id: string;
    proposalId: string;
    offeredBy: CounterOfferOrigin;
    proposedPrice: number;
    proposedTimeline: number;
    message?: string;
    status: CounterOfferStatus;
    createdAt: Date;
}