import { z } from "zod";

export const CreateReviewSchema = z.object({
    contractId: z.string().uuid(),
    rating: z.number().int().min(1).max(5, "Please choose between 1-5"),
    comment: z.string().min(10).max(500, "Maxium 500 characters please.")
});

export type ICreateReviewPayload = z.infer<typeof CreateReviewSchema>;