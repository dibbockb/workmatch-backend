import envConfig from '../envConfig';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: envConfig.cloudinary_cloud_name,
    api_key: envConfig.cloudinary_api_key,
    api_secret: envConfig.cloudinary_api_secret
});

export const uploadToCloudinary = async (filePath: string, folder: string) => {
    const result = await cloudinary.uploader.upload(filePath, {
        folder: `workmatch/${folder}`,
        resource_type: 'auto'
    });

    return {
        url: result.secure_url,
        publicId: result.public_id
    };
};

export const deleteFromCloudinary = async (publicId: string) => {
    await cloudinary.uploader.destroy(publicId);
};

export const cloudinaryInstance = cloudinary;