import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import httpStatus from 'http-status';
import { AppError } from '../../utils/AppError';
import { uploadToCloudinary } from '../../lib/cloudinary';
import { upload } from '../../lib/multer';

const uploadFile = catchAsync(async (req: Request, res: Response) => {
    if (!req.file) {
        throw new AppError(httpStatus.BAD_REQUEST, "No file provided");
    }
    const result = await uploadToCloudinary(
        req.file.buffer,
        req.file.originalname
    );

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "File uploaded to cloudinary.",
        data: result
    });
});

export const UploadController = {
    uploadFile
};

export const uploadMiddleware = upload.single('file');