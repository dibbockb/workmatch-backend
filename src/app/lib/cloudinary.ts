import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import envConfig from '../envConfig';

cloudinary.config({
    cloud_name: envConfig.cloudinary_cloud_name,
    api_key: envConfig.cloudinary_api_key,
    api_secret: envConfig.cloudinary_api_secret
});

export const uploadToCloudinary = async (
    buffer: Buffer,
    filename: string
) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                resource_type: 'auto',
                public_id: filename.split('.')[0]
            },
            (error, result) => {
                if (error) reject(error);
                else resolve({
                    url: result?.secure_url,
                    publicId: result?.public_id
                });
            }
        );

        Readable.from(buffer).pipe(stream);
    });
};

export const deleteFromCloudinary = async (publicId: string) => {
    await cloudinary.uploader.destroy(publicId);
};

export const cloudinaryInstance = cloudinary;