import asyncHandler from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { CDN } from "../models/cdn.model.js";
import { uploadToTransformBucket } from "../services/awsS3.service.js";

const activateTransformation = asyncHandler(async (req, res) => {
  const { cdnProjectID } = req.body;
  const cdn = await CDN.findOne({ cdnProjectID });
  if (!cdn) {
    throw new apiError(404, "CDN not found");
  }
  if (cdn.isTransfomActive) {
    throw new apiError(400, "Transformation already active");
  }
  if (!cdn.relativePath) {
    throw new apiError(400, "No relative path found");
  }
  if (cdn.fileType !== "image" && cdn.fileType !== "video") {
    throw new apiError(400, "Unsupported file type");
  }
  if (cdn.transformLimit < 5) {
    const response = await uploadToTransformBucket(cdn.relativePath);
    if (response.success) {
      cdn.isTransfomActive = true;
      cdn.transformLimit += 1;
      await cdn.save({ validateBeforeSave: false });
      return res
        .status(200)
        .json(
          new apiResponse(200, cdn, "CDN transformation activated successfully")
        );
    } else {
      throw new apiError(500, "Failed to activate transformation");
    }
  } else {
    throw new apiError(400, "Transformation limit hit");
  }
});

export { activateTransformation };
