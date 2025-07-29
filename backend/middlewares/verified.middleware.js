import asyncHandler from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";

export const verifiedMiddleware = asyncHandler(async (req, res, next) => {
  if (!req.user.isVerified) {
    throw new apiError(401, "User is not verified");
  }
  next();
});
