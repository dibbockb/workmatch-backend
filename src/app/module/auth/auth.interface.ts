import { UserRoles } from "../../../generated/prisma/browser"
import { z } from "zod"
import { LoginValidationSchema, RegisterValidationSchema } from "./auth.validation"

export type IRegisterUserPayload = z.infer<typeof RegisterValidationSchema>
export type ILoginUserPayload = z.infer<typeof LoginValidationSchema>

export interface ITokenPayload {
    userId: string,
    email: string,
    name: string,
    role: UserRoles
}

export interface IRequestUser {
    userId: string
    email: string
    name: string
    role: UserRoles
}