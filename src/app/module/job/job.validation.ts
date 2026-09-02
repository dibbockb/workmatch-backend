import { z } from "zod";

const JobBaseSchema = z.object({
    title: z.string().min(10, { message: "Title must be at least 10 characters" }).max(200),
    description: z.string().min(20).max(5000),
    requiredSkills: z.array(z.string()).min(1).max(10),
    budgetMin: z.number().positive(),
    budgetMax: z.number().positive(),
    deadline: z.string().datetime().refine(
        (date) => new Date(date) > new Date(Date.now() + 24 * 60 * 60 * 1000),
        { message: "Deadline must be at least 24 hours away" },
    ),
});

export const CreateJobValidationSchema = JobBaseSchema.refine(
    (data) => data.budgetMax >= data.budgetMin,
    { message: "Maximum budget must be greater than or equal to minimum budget", path: ["budgetMax"] }
);

export const UpdateJobValidationSchema = JobBaseSchema.partial().refine(
    (data) => {
        if (data.budgetMin !== undefined && data.budgetMax !== undefined) {
            return data.budgetMax >= data.budgetMin;
        }
        return true;
    },
    { message: "Maximum budget must be greater than or equal to minimum budget", path: ["budgetMax"] }
);

export type ICreateJobPayload = z.infer<typeof CreateJobValidationSchema>
export type IUpdateJobPayload = z.infer<typeof UpdateJobValidationSchema>