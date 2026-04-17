import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';

cloudinary.config({
  cloud_name: process.env.Cloudinary_Cloud_Name,
  api_key: process.env.Cloudinary_Api_Key,
  api_secret: process.env.Cloudinary_Api_Secret,
});

const uploadImageToCloudinary = async (imageTitle: string, buffer: Buffer) => {
  return new Promise<string>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { public_id: imageTitle },
      (error, result) => {
        if (error) return reject(error);
        resolve(result!.secure_url);
      },
    );

    uploadStream.end(buffer);
  });
};

const storage = multer.memoryStorage();
export const upload = multer({ storage });

export default uploadImageToCloudinary;
