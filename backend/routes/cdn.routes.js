import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  uploadFile,
  captureRelativePaths,
} from "../middlewares/multer.middleware.js";
import {
  registerCDN,
  updateCDN,
  getCDN,
  deleteCDN,
  confirmVideoUpload,
} from "../controllers/cdn.controller.js";
import { generateImage } from "../controllers/ai.controller.js";
import { logger } from "../utils/logger.js";
import { activateTransformation } from "../controllers/transformation.controller.js";
import { verifiedMiddleware } from "../middlewares/verified.middleware.js";

const router = Router();

router
  .route("/register")
  .post(
    logger,
    verifyJWT, verifiedMiddleware,
    captureRelativePaths,
    uploadFile.array("files", 1),
    registerCDN
  );
router.route("/video/upload/callback").post(logger, confirmVideoUpload);
router.route("/getCdn").get(logger, verifyJWT, verifiedMiddleware, getCDN);
router
  .route("/updateCdn")
  .post(
    logger,
    verifyJWT, verifiedMiddleware,
    captureRelativePaths,
    uploadFile.array("files", 1),
    updateCDN
  );
router.route("/deleteCdn").post(logger,verifyJWT, verifiedMiddleware, deleteCDN);
router.route("/generateImage").post(logger, verifyJWT, verifiedMiddleware, generateImage);
router
  .route("/activateTransformation")
  .post(logger, verifyJWT, verifiedMiddleware, activateTransformation);

export default router;
