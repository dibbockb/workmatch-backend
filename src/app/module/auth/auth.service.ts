import bcrypt from 'bcryptjs'
import { JwtPayload, SignOptions } from 'jsonwebtoken'
import { UserRoles, UserStatus } from '../../../generated/prisma/enums'
import config from '../../envConfig'
import { prisma } from '../../lib/prisma'
import { jwtUtils } from '../../utils/jwt'
import {
    ILoginUserPayload,
    IRegisterUserPayload,
    IRequestUser,
    ITokenPayload
} from './auth.interface'
import envConfig from '../../envConfig'


const registerUser = async (payload: IRegisterUserPayload) => {
    const { name, email, password, role, companyName } = payload
    const normalizedEmail = email.trim().toLocaleLowerCase()

    const isUserExists = await prisma.user.findUnique({
        where: { email: normalizedEmail },
    })

    if (isUserExists) {
        throw new Error('User with this email already exists')
    }

    const hashedPassword = await bcrypt.hash(password, Number(envConfig.bcrypt_salt_rounds))

    const createdUser = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
            data: {
                name,
                email: normalizedEmail,
                password: hashedPassword,
                role: role as UserRoles,
                status: UserStatus.ACTIVE,
                emailVerified: false,
            },
            omit: { password: true },
        })

        if (role === UserRoles.FREELANCER) {
            await tx.freelancer.create({
                data: {
                    userId: user.id,
                    bio: '',
                    skills: [],
                    hourlyRate: 0,
                    portfolioUrl: null,
                }
            })
        }

        else if (role === UserRoles.CLIENT) {
            await tx.client.create({
                data: {
                    userId: user.id,
                    companyName: companyName || name,
                    bio: '',
                    totalSpent: 0,
                    postedJobs: 0,
                    averageRating: 0,
                }
            })
        }
        return user;
    })

    const tokenPayload: ITokenPayload = {
        userId: createdUser.id,
        name: createdUser.name,
        email: createdUser.email,
        role: createdUser.role as UserRoles
    }

    const accessToken = jwtUtils.createToken(
        tokenPayload,
        config.jwt_access_secret,
        config.jwt_access_expires_in as SignOptions
    );

    const refreshToken = jwtUtils.createToken(
        tokenPayload,
        config.jwt_refresh_secret,
        config.jwt_refresh_expires_in as SignOptions
    );

    return {
        user: createdUser,
        accessToken,
        refreshToken
    }
}

const loginUser = async (payload: ILoginUserPayload) => {
    const { password } = payload
    const email = payload.email.trim().toLowerCase()

    const user = await prisma.user.findUnique({
        where: { email },
    })

    if (!user) {
        throw new Error('User not found')
    }

    if (user.status === UserStatus.BLOCKED) {
        throw new Error('User is blocked')
    }

    if (user.isDeleted || user.status === UserStatus.DELETED) {
        throw new Error('User is deleted')
    }

    const isPasswordMatched = await bcrypt.compare(password, user.password)

    if (!isPasswordMatched) {
        throw new Error('Invalid credentials')
    }

    const jwtPayload = {
        userId: user.id,
        name: user.name,
        email: user.email,
        role: user.role
    }

    const accessToken = jwtUtils.createToken(
        jwtPayload,
        config.jwt_access_secret,
        config.jwt_access_expires_in as SignOptions
    );

    const refreshToken = jwtUtils.createToken(
        jwtPayload,
        config.jwt_refresh_secret,
        config.jwt_refresh_expires_in as SignOptions
    );

    return {
        accessToken,
        refreshToken
    }
}

const getMe = async (user: IRequestUser) => {
    const isUserExists = await prisma.user.findUnique({
        where: {
            id: user.userId,
        },
        include: {
            freelancer: true,
        },
        omit: {
            password: true,
        },
    })

    if (!isUserExists) {
        throw new Error('User not found')
    }

    return isUserExists
}

const refreshToken = async (token: string) => {
    const verifiedRefreshToken = jwtUtils.verifyToken(token, config.jwt_refresh_secret)

    if (!verifiedRefreshToken.success || !verifiedRefreshToken.data) {
        throw new Error(config.node_env === 'development' ? verifiedRefreshToken.error : 'Invalid refresh token')
    }

    const data = verifiedRefreshToken.data as JwtPayload

    const user = await prisma.user.findUnique({
        where: { id: data.userId },
    })

    if (!user || user.isDeleted || user.status !== UserStatus.ACTIVE) {
        throw new Error('User is inactive or not found')
    }

    const jwtPayload = {
        userId: user.id,
        name: user.name,
        email: user.email,
        role: user.role
    }

    const accessToken = jwtUtils.createToken(
        jwtPayload,
        config.jwt_access_secret,
        config.jwt_access_expires_in as SignOptions
    );

    const refreshToken = jwtUtils.createToken(
        jwtPayload,
        config.jwt_refresh_secret,
        config.jwt_refresh_expires_in as SignOptions
    );

    return {
        accessToken,
        refreshToken
    }
}



export const AuthService = {
    registerUser,
    loginUser,
    getMe,
    refreshToken
}
