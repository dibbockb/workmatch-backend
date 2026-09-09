import { Router } from 'express';
import { auth } from '../../middleware/checkAuth';
import { UploadController, uploadMiddleware } from './upload.controller';

const router = Router();

router.post(
    '/',
    auth(),
    uploadMiddleware,
    UploadController.uploadFile
);

export const UploadRoutes = router;