import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    if (!localFilePath.includes("https://ui-avatars.com/")) {
      fs.unlinkSync(localFilePath);
    }
    return response;
  } catch (error) {
    if (!localFilePath.includes("https://ui-avatars.com/")) {
      fs.unlinkSync(localFilePath);
    }
    return null;
  }
};
const deleteOnCloudinary = async (filePath) => {
  try {
    if (!filePath) return null;
    const publicId = filePath.split("/").pop().split(".")[0];
    await cloudinary.uploader.destroy(publicId);
    return true;
  } catch (error) {
    return null;
  }
};
export { uploadOnCloudinary, deleteOnCloudinary };
