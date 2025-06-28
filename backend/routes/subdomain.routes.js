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
const router = Router();
router
  .route("/register")
  .post(
    logger,
    verifyJWT,
    captureRelativePaths,
    uploadFile.array("files", 400),
    registerSubDomain
  );
router.route("/update").post(logger, verifyJWT, updateSubDomain);
router.route("/delete").post(logger, verifyJWT, deleteSubDomain);
router
  .route("/changecontents")
  .post(
    logger,
    verifyJWT,
    captureRelativePaths,
    uploadFile.array("files", 400),
    changeSubDomainContents
  );
router.route("/getuploadsignedurl").post(logger, verifyJWT, getUploadSignedUrl);
router.route("/getcontents").post(logger, verifyJWT, getSubDomainContents);
router
  .route("/updatevisibility")
  .post(logger, verifyJWT, updateSubDomainVisibility);
router.route("/getviewsignedurl").post(logger, verifyJWT, getViewSignedUrl);

export default router;
