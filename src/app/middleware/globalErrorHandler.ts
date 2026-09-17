import { NextFunction, Request, Response } from 'express';
import httpStatus from "http-status";
import { Prisma } from '../../generated/prisma/client';
import { AppError } from '../utils/AppError';
import envConfig from '../envConfig';
import { ZodError } from 'zod';
import { handleJwtError, handleMulterError, handlePrismaKnownError, handlePrismaValidationError, handleZodError } from '../utils/errorHandlers';
import { JsonWebTokenError } from 'jsonwebtoken';
import { MulterError } from 'multer';

export type TErrorSource = {
    path: string;
    message: string;
};

export type TGenericErrorResponse = {
    statusCode: number;
    message: string;
    errorSources: TErrorSource[];
};

export const globalErrorHandler = (
    err: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction,
) => {
    const isDev = envConfig.node_env === "development";

    let statusCode: number = httpStatus.INTERNAL_SERVER_ERROR;
    let message = "Something went wrong";
    let errorSources: TErrorSource[] = [];

    if (err instanceof ZodError) {
        ({ statusCode, message, errorSources } = handleZodError(err));
    } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
        ({ statusCode, message, errorSources } = handlePrismaKnownError(err));
    } else if (err instanceof Prisma.PrismaClientValidationError) {
        ({ statusCode, message, errorSources } = handlePrismaValidationError());
    } else if (err instanceof Prisma.PrismaClientInitializationError) {
        statusCode = httpStatus.SERVICE_UNAVAILABLE;
        message = "Database is unavailable";
        errorSources = [{ path: "", message: "Could not reach the database server" }];
    } else if (err instanceof JsonWebTokenError) {
        ({ statusCode, message, errorSources } = handleJwtError(err));
    } else if (err instanceof MulterError) {
        ({ statusCode, message, errorSources } = handleMulterError(err));
    } else if (err instanceof AppError) {
        statusCode = err.statusCode;
        message = err.message;
        errorSources = [{ path: "", message: err.message }];
    } else if (err instanceof Error) {
        message = err.message;
        errorSources = [{ path: "", message: err.message }];
    }

    if (statusCode >= 500) {
        console.error("[error]", err);
    }

    res.status(statusCode).json({
        success: false,
        message,
        errors: errorSources,
        ...(isDev && { stack: err instanceof Error ? err.stack : undefined }),
    });
};
