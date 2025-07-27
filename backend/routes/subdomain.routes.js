import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  uploadFile,
  captureRelativePaths,
} from "../middlewares/multer.middleware.js";
import {
  registerSubDomain,
  updateSubDomain,
  deleteSubDomain,
  changeSubDomainContents,
  getUploadSignedUrl,
  getSubDomainContents,
  updateSubDomainVisibility,
  getViewSignedUrl,
} from "../controllers/subdomain.controller.js";
import { logger } from "../utils/logger.js";
import { verifiedMiddleware } from "../middlewares/verified.middleware.js";
const router = Router();
router
  .route("/register")
  .post(
    logger,
    verifyJWT,verifiedMiddleware,
    captureRelativePaths,
    uploadFile.array("files", 400),
    registerSubDomain
  );
router.route("/update").post(logger, verifyJWT,verifiedMiddleware, updateSubDomain);
router.route("/delete").post(logger, verifyJWT, verifiedMiddleware,deleteSubDomain);
router
  .route("/changecontents")
  .post(
    logger,
    verifyJWT,verifiedMiddleware,
    captureRelativePaths,
    uploadFile.array("files", 400),
    changeSubDomainContents
  );
router.route("/getuploadsignedurl").post(logger, verifyJWT,verifiedMiddleware, getUploadSignedUrl);
router.route("/getcontents").post(logger, verifyJWT, getSubDomainContents);
router
  .route("/updatevisibility")
  .post(logger, verifyJWT,verifiedMiddleware, updateSubDomainVisibility);
router.route("/getviewsignedurl").post(logger, verifyJWT,verifiedMiddleware, getViewSignedUrl);

export default router;
