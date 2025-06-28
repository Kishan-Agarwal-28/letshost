import { v2 as cloudinary } from "cloudinary";
import mime from "mime-types";
import path from "path";
import fs from "fs/promises";
import { statSync, rmSync, existsSync, unlinkSync, readFileSync, rm } from "fs";
import { nanoid } from "nanoid";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    const response = await cloudinary.uploader.upload(localFilePath, {
      asset_folder: "__profiles",
      resource_type: "auto",
    });
    if (!localFilePath.includes("https://ui-avatars.com/")) {
      rmSync(localFilePath, { recursive: true, force: true });
    }
    return response;
  } catch (error) {
    if (!localFilePath.includes("https://ui-avatars.com/")) {
      rmSync(localFilePath, { recursive: true, force: true });
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

const listMediaObjectsOnCDN = async (version, folder, userID, cdnID) => {
  try {
    console.log(version, folder, userID, cdnID);

    const objects = await cloudinary.api.resources_by_asset_folder(
      `__cdn/${userID}/${folder}/${cdnID}/${version}`
    );

    console.log(objects);

    let publicIds = [];

    // Check if resources exist and is an array
    if (objects && objects.resources && Array.isArray(objects.resources)) {
      for (const object of objects.resources) {
        publicIds.push(object.public_id);
      }
    }

    return publicIds;
  } catch (error) {
    // Enhanced error handling
    const errorMessage =
      error?.message ||
      error?.error?.message ||
      JSON.stringify(error) ||
      "Unknown error occurred";

    // If folder doesn't exist, return empty array instead of throwing
    if (
      errorMessage.includes("not found") ||
      errorMessage.includes("does not exist") ||
      error?.http_code === 404
    ) {
      console.warn(
        `CDN folder not found: __cdn/${userID}/${folder}/${cdnID}/${version}`
      );
      return [];
    }

    console.error("Error in listMediaObjectsOnCDN:", error);
    throw new Error("Error listing media objects on CDN: " + errorMessage);
  }
};

const deleteMediaFromCDN = async (
  userID,
  version,
  folder,
  cdnID,
  public_id
) => {
  try {
    if (!public_id) {
      const publicIds = await listMediaObjectsOnCDN(
        version,
        folder,
        userID.toString(),
        cdnID
      );

      // If no public IDs found, nothing to delete
      if (!publicIds || publicIds.length === 0) {
        console.warn(
          `No media objects found for CDN folder: __cdn/${userID}/${folder}/${cdnID}/${version}`
        );
        return { deleted: [], not_found: [] };
      }

      const fileType =
        folder === "img" ? "image" : folder === "video" ? "video" : "auto";

      const data = await cloudinary.api.delete_resources(publicIds, {
        resource_type: fileType,
      });

      console.log(`Deleted ${publicIds.length} resources from CDN`);
      return data;
    } else {
      // Delete single resource
      const resourceType =
        folder === "img" ? "image" : folder === "video" ? "video" : "auto";

      const data = await cloudinary.api.delete_resources([public_id], {
        resource_type: resourceType,
        type: "upload",
      });

      console.log(`Deleted single resource: ${public_id}`);
      return data;
    }
  } catch (error) {
    const errorMessage =
      error?.message ||
      error?.error?.message ||
      JSON.stringify(error) ||
      "Unknown error occurred";

    console.log("Error in deleteMediaFromCDN:", error);

    // If folder/resource doesn't exist, log warning but don't throw
    if (
      errorMessage.includes("not found") ||
      errorMessage.includes("does not exist") ||
      error?.http_code === 404
    ) {
      console.warn(
        `CDN resource not found: __cdn/${userID}/${folder}/${cdnID}/${version}`
      );
      return { deleted: [], not_found: [public_id || "multiple"] };
    }

    throw new Error("Error deleting media from CDN: " + errorMessage);
  }
};

const uploadMediaToCDN = async (
  userID,
  currentVersion,
  previousVersion,
  cdnID
) => {
  const distFolderPath = path.join(
    process.cwd(),
    "public",
    "temp",
    userID.toString()
  );

  console.log("distFolderPath:", distFolderPath);

  if (!existsSync(distFolderPath)) {
    throw new Error("Directory does not exist");
  }

  try {
    const files = await fs.readdir(distFolderPath, { withFileTypes: true });

    if (files.length === 0) {
      console.log("No files to upload.");
      throw new Error("No files to upload");
    }

    const fullPath = path.join(distFolderPath, files[0].name);
    const contentType = mime.lookup(fullPath) || undefined;
    const folder = contentType?.toString().toLowerCase()?.includes("image")
      ? "img"
      : contentType?.toString().toLowerCase()?.includes("video")
        ? "video"
        : contentType?.toString().toLowerCase()?.includes("mp4")
          ? "video"
          : undefined;

    if (!folder) {
      throw new Error("Unsupported file type for CDN upload");
    }

    const byteArrayBuffer = readFileSync(fullPath);
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: `__cdn/${userID}/${folder}/${cdnID}/${currentVersion}`,
            discard_original_filename: false,
          },
          (error, uploadResult) => {
            if (error) {
              reject(error);
            } else {
              resolve(uploadResult);
            }
          }
        )
        .end(byteArrayBuffer);
    });

    console.log("Uploaded:", files[0].name);
    console.log("Upload Result:", uploadResult);

    // Clean up temp folder
    rmSync(distFolderPath, { recursive: true, force: true });
    console.log("Done. Upload completed and temp folder cleaned.");

    // Delete previous version if exists
    if (previousVersion !== 0) {
      try {
        await deleteMediaFromCDN(userID, previousVersion, folder, cdnID);
      } catch (deleteError) {
        console.warn("Failed to delete previous version:", deleteError.message);
        // Don't throw here, as the upload was successful
      }
    }

    return uploadResult;
  } catch (error) {
    console.error("Error uploading to CDN:", error);

    // Clean up temp folder even on error
    if (existsSync(distFolderPath)) {
      rmSync(distFolderPath, { recursive: true, force: true });
    }

    throw new Error(
      "Failed to upload to CDN: " + (error?.message || "Unknown error")
    );
  }
};

const uploadMediaVideoToCDN = async (
  userID,
  currentVersion,
  previousVersion,
  cdnID
) => {
  const public_id = nanoid(25);
  const timestamp = Math.round(Date.now() / 1000);

  const folderPath = `__cdn/${userID}/video/${cdnID}/${currentVersion}`;
  console.log(folderPath);
  console.log(public_id);

  const paramsToSign = {
    folder: folderPath,
    public_id: public_id,
    timestamp: timestamp.toString(),
    unique_filename: "false",
    notification_url: `{process.env.BACKEND_URI}/api/v1/cdn/video/upload/callback`,
  };

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    cloudinary.config().api_secret
  );

  console.log("Signature:", signature);
  console.log("Public ID:", public_id);
  console.log("Timestamp:", timestamp.toString());

  return {
    ...paramsToSign,
    signature: signature,
  };
};

const deleteEmptyFolders = async (userID, folder, cdnProjectID) => {
  try {
    const folderPath = `__cdn/${userID.toString()}/${folder}/${cdnProjectID}`;
    console.log(`Attempting to delete folder: ${folderPath}`);

    const data = await cloudinary.api.delete_folder(folderPath);
    console.log(`Successfully deleted folder: ${folderPath}`);
    return data;
  } catch (error) {
    const errorMessage =
      error?.message ||
      error?.error?.message ||
      JSON.stringify(error) ||
      "Unknown error occurred";

    console.log("Error in deleteEmptyFolders:", error);

    // If folder doesn't exist, log warning but don't throw
    if (
      errorMessage.includes("not found") ||
      errorMessage.includes("does not exist") ||
      error?.http_code === 404
    ) {
      console.warn(
        `Folder not found (already deleted?): __cdn/${userID}/${folder}/${cdnProjectID}`
      );
      return { message: "Folder not found or already deleted" };
    }

    throw new Error("Error deleting empty folders: " + errorMessage);
  }
};

const uploadImageToGallery = async (imageData) => {
  try {
    // Handle base64 image data
    let base64Data = imageData;

    // If the imageData doesn't have the data URL prefix, add it
    if (!base64Data.startsWith("data:")) {
      base64Data = `data:image/png;base64,${imageData}`;
    }

    const response = await cloudinary.uploader.upload(base64Data, {
      folder: `__gallery`, // Fixed typo: galery -> gallery
      public_id: nanoid(25),
      tags: ["pending"],
      resource_type: "image",
    });

    return response; // Return the response object
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
};

const commitImageToGallery = async (imageId) => {
  await cloudinary.uploader.remove_all_tags(imageId);
  await cloudinary.uploader.add_tag(imageId, "approved");
};

export {
  uploadOnCloudinary,
  deleteOnCloudinary,
  listMediaObjectsOnCDN,
  deleteMediaFromCDN,
  uploadMediaToCDN,
  uploadMediaVideoToCDN,
  deleteEmptyFolders,
  uploadImageToGallery,
  commitImageToGallery,
};
