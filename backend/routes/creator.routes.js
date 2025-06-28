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

const router = Router();

router.route("/registerCreator").post(logger, verifyJWT, registerCreator);
router.route("/updateFullName").post(logger, verifyJWT, updateCreatorFullName);
router
  .route("/updateDescription")
  .post(logger, verifyJWT, updateCreatorDescription);
router
  .route("/updateCoverImage")
  .patch(
    logger,
    verifyJWT,
    uploadFile.array("files", 1),
    updateCreatorCoverImage
  );
router.route("/updateLocation").post(logger, verifyJWT, updateCreatorLocation);
router.route("/updateLinks").post(logger, verifyJWT, updateCreatorLinks);
router.route("/follow").post(logger, verifyJWT, followCreator);
router.route("/getCreatorDetails").get(logger, verifyJWT, getCreatorDetails);
router.route("/getCreatorStats").get(logger, verifyJWT, getCreatorStats);
router
  .route("/updateCreatorDetails")
  .post(logger, verifyJWT, updateCreatorDetails);

export default router;
