import { z } from "zod";

export const CreateProposalValidationSchema = z.object({
    jobId: z.string().uuid({ message: "Invalid job ID" }),
    proposedPrice: z
        .number()
        .positive({ message: "Proposed price must be positive" }),
    proposedTimeline: z
        .number()
        .int()
        .positive({ message: "Timeline must be positive integer (days)" })
        .max(365, { message: "Timeline cannot exceed 365 days" }),
    approachDescription: z
        .string()
        .min(20, { message: "Approach must be at least 20 characters" })
        .max(2000, { message: "Approach must be at most 2000 characters" }),
});

export const CreateCounterOfferValidationSchema = z.object({
    proposedPrice: z
        .number()
        .positive({ message: "Proposed price must be positive" }),
    proposedTimeline: z
        .number()
        .int()
        .positive({ message: "Timeline must be positive integer (days)" }),
    message: z
        .string()
        .optional(),
});

export type ICreateProposalPayload = z.infer<typeof CreateProposalValidationSchema>;
export type ICreateCounterOfferPayload = z.infer<typeof CreateCounterOfferValidationSchema>;