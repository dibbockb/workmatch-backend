import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import httpStatus from 'http-status';
import { uploadToCloudinary } from '../../lib/cloudinary';
import { upload } from '../../lib/multer';

const uploadFile = catchAsync(async (req: Request, res: Response) => {
    if (!req.file) {
        throw new Error("No file provided");
    }

    const { folder = 'uploads' } = req.query;

    const fs = require('fs');
    const path = `/tmp/${Date.now()}-${req.file.originalname}`;
    fs.writeFileSync(path, req.file.buffer);

    const result = await uploadToCloudinary(path, folder as string);

    fs.unlinkSync(path);

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