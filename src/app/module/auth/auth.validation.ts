import { z } from "zod"

export const RegisterValidationSchema = z.object({
    name: z
        .string()
        .min(2, { message: 'Name must be at least 2 characters.' })
        .max(50, { message: 'Name must be at most 50 characters.' })
        .trim(),
    email: z
        .string()
        .email({ message: 'Invalid email address.' })
        .toLowerCase()
        .trim(),
    password: z
        .string()
        .min(8, { message: 'Password must be at least 8 characters.' })
        .max(50, { message: 'Please choose a password below 50 characters.' })
        .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter.' })
        .regex(/[0-9]/, { message: 'Password must contain at least one number.' }),
    role: z.enum(['CLIENT', 'FREELANCER']).default('FREELANCER'),
    companyName: z
        .string()
        .min(2, { message: 'Company name must be at least 2 characters.' })
        .optional()
})

export const LoginValidationSchema = z.object({
    email: z
        .string()
        .email({ message: 'Invalid email address.' })
        .toLowerCase()
        .trim(),
    password: z
        .string()
        .min(1, { message: 'Password is required.' })
})

export type IRegisterPayload = z.infer<typeof RegisterValidationSchema>
export type ILoginPayload = z.infer<typeof LoginValidationSchema>