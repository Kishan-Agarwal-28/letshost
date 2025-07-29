import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  registerCreator,
  updateCreatorFullName,
  updateCreatorDescription,
  updateCreatorCoverImage,
  updateCreatorLocation,
  updateCreatorLinks,
  followCreator,
  getCreatorDetails,
  getCreatorStats,
  updateCreatorDetails,
} from "../controllers/creator.controller.js";
import { uploadFile } from "../middlewares/multer.middleware.js";
import { logger } from "../utils/logger.js";
import { verifiedMiddleware } from "../middlewares/verified.middleware.js";

const router = Router();

router
  .route("/registerCreator")
  .post(logger, verifyJWT, verifiedMiddleware, registerCreator);
router
  .route("/updateFullName")
  .post(logger, verifyJWT, verifiedMiddleware, updateCreatorFullName);
router
  .route("/updateDescription")
  .post(logger, verifyJWT, verifiedMiddleware, updateCreatorDescription);
router
  .route("/updateCoverImage")
  .patch(
    logger,
    verifyJWT,
    verifiedMiddleware,
    uploadFile.array("files", 1),
    updateCreatorCoverImage
  );
router
  .route("/updateLocation")
  .post(logger, verifyJWT, verifiedMiddleware, updateCreatorLocation);
router
  .route("/updateLinks")
  .post(logger, verifyJWT, verifiedMiddleware, updateCreatorLinks);
router
  .route("/follow")
  .post(logger, verifyJWT, verifiedMiddleware, followCreator);
router
  .route("/getCreatorDetails")
  .get(logger, verifyJWT, verifiedMiddleware, getCreatorDetails);
router
  .route("/getCreatorStats")
  .get(logger, verifyJWT, verifiedMiddleware, getCreatorStats);
router
  .route("/updateCreatorDetails")
  .post(logger, verifyJWT, verifiedMiddleware, updateCreatorDetails);

export default router;
