import { Request, Response } from 'express'
import httpStatus from 'http-status'
import { catchAsync } from '../../utils/catchAsync'
import { sendResponse } from '../../utils/sendResponse'
import { IRequestUser } from './auth.interface'
import { AuthService } from './auth.service'
import { LoginValidationSchema, RegisterValidationSchema } from './auth.validation'
import envConfig from '../../envConfig'

const registerUser = catchAsync(async (req: Request, res: Response) => {
    const validatedPayload = RegisterValidationSchema.parse(req.body)
    const result = await AuthService.registerUser(validatedPayload)

    const { accessToken, refreshToken, user } = result

    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: envConfig.node_env === 'production',
        sameSite: "lax",
        maxAge: 1000 * 60 * 60 * 24 // 24 hour
    })
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: envConfig.node_env === 'production',
        sameSite: "lax",
        maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
    })

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: 'User registered successfully',
        data: {
            accessToken,
            refreshToken,
            user,
        },
    })
})

const loginUser = catchAsync(async (req: Request, res: Response) => {
    const validatedPayload = LoginValidationSchema.parse(req.body)
    const result = await AuthService.loginUser(validatedPayload)
    const { accessToken, refreshToken } = result

    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: envConfig.node_env === 'production',
        sameSite: "lax",
        maxAge: 1000 * 60 * 60 * 24 // 24 hour
    })
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: envConfig.node_env === 'production',
        sameSite: "lax",
        maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
    })

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'User logged in successfully',
        data: {
            accessToken,
            refreshToken
        },
    })
})

const getMe = catchAsync(async (req: Request, res: Response) => {
    const user = req.user as unknown as IRequestUser

    if (!user) {
        throw new Error('User information is missing in the request')
    }

    const result = await AuthService.getMe(user)
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'User profile fetched successfully',
        data: result,
    })
})

const refreshToken = catchAsync(async (req: Request, res: Response) => {
    if (!req.cookies.refreshToken) {
        throw new Error('Refresh token is missing')
    }
    const result = await AuthService.refreshTokenHandler(req.cookies.refreshToken)
    const { accessToken, refreshToken: newRefreshToken } = result

    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: envConfig.node_env === 'production',
        sameSite: "lax",
        maxAge: 1000 * 60 * 60 * 24 // 24 hour or 1 day
    })
    res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: envConfig.node_env === 'production',
        sameSite: "lax",
        maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
    })

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'New tokens generated successfully',
        data: {
            accessToken,
            refreshToken: newRefreshToken,
        },
    })
})


export const AuthController = {
    registerUser,
    loginUser,
    getMe,
    refreshToken,
}
