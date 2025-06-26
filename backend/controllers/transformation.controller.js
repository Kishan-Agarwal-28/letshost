import asyncHandler from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { CDN } from "../models/cdn.model.js";

const activateTransformation = asyncHandler(async (req, res) => {
  const { cdnProjectID } = req.body;
  try {
    const cdn = await CDN.findOne({ cdnProjectID });
    if (!cdn) {
      throw new apiError(404, "CDN not found");
    }
    cdn.isTransfomActive = true;
    await cdn.save({ validateBeforeSave: false });

    return res.status(200).json(new apiResponse(200, cdn, "CDN transformation activated successfully"));
  } catch (error) {
    throw new apiError(500, error.message);
  }
});

export { activateTransformation };
