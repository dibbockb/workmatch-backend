import httpStatus from "http-status";
import jwt from "jsonwebtoken";
import { MulterError } from "multer";
import { ZodError } from "zod";
import { Prisma } from "../../generated/prisma/client";
import {
	TErrorSource,
	TGenericErrorResponse,
} from "../middleware/globalErrorHandler";

export const handleZodError = (err: ZodError): TGenericErrorResponse => {
	const errorSources: TErrorSource[] = err.issues.map((issue) => ({
		path: issue.path.join(".") || "body",
		message: issue.message,
	}));

	return {
		statusCode: httpStatus.BAD_REQUEST,
		message: "Validation failed",
		errorSources,
	};
};

export const handlePrismaKnownError = (
	err: Prisma.PrismaClientKnownRequestError,
): TGenericErrorResponse => {
	switch (err.code) {
		case "P2002": {
			const target = (err.meta?.target as string[] | undefined) ?? [];
			const field = target.join(", ") || "field";
			return {
				statusCode: httpStatus.CONFLICT,
				message: `Duplicate value for ${field}`,
				errorSources: [{ path: field, message: `${field} already exists` }],
			};
		}
		case "P2003": {
			const field = (err.meta?.field_name as string | undefined) ?? "relation";
			return {
				statusCode: httpStatus.BAD_REQUEST,
				message: "Related record does not exist",
				errorSources: [
					{ path: field, message: "Foreign key constraint failed" },
				],
			};
		}
		case "P2025":
			return {
				statusCode: httpStatus.NOT_FOUND,
				message: "Record not found",
				errorSources: [
					{ path: "", message: "The requested record does not exist" },
				],
			};
		case "P2014":
			return {
				statusCode: httpStatus.BAD_REQUEST,
				message: "Operation violates a required relation",
				errorSources: [{ path: "", message: err.message }],
			};
		default:
			return {
				statusCode: httpStatus.BAD_REQUEST,
				message: "Database request failed",
				errorSources: [{ path: "", message: `Prisma error ${err.code}` }],
			};
	}
};

export const handlePrismaValidationError = (): TGenericErrorResponse => ({
	statusCode: httpStatus.BAD_REQUEST,
	message: "Invalid data sent to the database",
	errorSources: [{ path: "", message: "Missing or wrongly typed fields" }],
});

export const handleJwtError = (
	err: jwt.JsonWebTokenError,
): TGenericErrorResponse => ({
	statusCode: httpStatus.UNAUTHORIZED,
	message:
		err instanceof jwt.TokenExpiredError
			? "Session expired. Please log in again."
			: "Invalid token. Please log in again.",
	errorSources: [{ path: "authorization", message: err.message }],
});

export const handleMulterError = (err: MulterError): TGenericErrorResponse => ({
	statusCode: httpStatus.BAD_REQUEST,
	message:
		err.code === "LIMIT_FILE_SIZE" ? "File is too large" : "File upload failed",
	errorSources: [{ path: err.field ?? "file", message: err.message }],
});
