import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  uploadFile,
  captureRelativePaths,
} from "../middlewares/multer.middleware.js";
import { registerCDN,updateCDN,getCDN,deleteCDN ,confirmVideoUpload} from "../controllers/cdn.controller.js";
import { generateImage } from "../controllers/ai.controller.js";
import {logger} from "../utils/logger.js";
import { activateTransformation } from "../controllers/transformation.controller.js";

const router = Router();

router.route("/register").post(logger, verifyJWT,captureRelativePaths,uploadFile.array("files",1),registerCDN);
router.route("/video/upload/callback").post(logger, confirmVideoUpload)
router.route("/getCdn").get(logger, verifyJWT,getCDN);
router.route("/updateCdn").post(logger, verifyJWT,captureRelativePaths,uploadFile.array("files",1),updateCDN);
router.route("/deleteCdn").post( verifyJWT,deleteCDN);
router.route("/generateImage").post(logger, verifyJWT,generateImage);
router.route("/activateTransformation").post(logger, verifyJWT,activateTransformation);

export default router;