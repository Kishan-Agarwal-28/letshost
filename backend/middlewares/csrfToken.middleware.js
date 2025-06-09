import { apiError } from "../utils/apiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

export const verifyCsrfToken = asyncHandler(async (req, _, next) => {
  try {
    const csrfToken = req.body.csrfToken;
    if (!csrfToken) {
      throw new apiError(401, "Unauthorized request");
    }
    const decodedToken = jwt.verify(csrfToken, process.env.CSRFTOKEN_SECRET);
    bcrypt.compare(decodedToken, process.env.CSRFTOKEN);
    next();
  } catch (error) {
    throw new apiError(401, error?.message || "Invalid csrf token");
  }
});
