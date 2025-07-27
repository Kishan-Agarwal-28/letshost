import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";

import { logger } from "../utils/logger.js";
import {
  addToGallery,
  likeImage,
  saveImage,
  deleteImage,
  getImagesOfUser,
  getGallery,
  getTotalImagesCount,
  searchImages,
  getSimilarImages,
  advancedSearch,
  discoverImages,
  downloadImage,
} from "../controllers/gallery.controller.js";
import { verifyJWTOPT } from "../middlewares/auth.opt.middleware.js";
import { verifiedMiddleware } from "../middlewares/verified.middleware.js";

const router = Router();

router.route("/addToGallery").post(logger, verifyJWT,verifiedMiddleware, addToGallery);
router.route("/likeImage").post(logger, verifyJWT,verifiedMiddleware, likeImage);
router.route("/saveImage").post(logger, verifyJWT,verifiedMiddleware, saveImage);
router.route("/deleteImage").post(logger, verifyJWT,verifiedMiddleware, deleteImage);
router.route("/getImagesOfUser").get(logger, verifyJWT,verifiedMiddleware, getImagesOfUser);
router.route("/getGallery").get(logger, verifyJWTOPT, getGallery);
router.route("/getTotalImagesCount").get(logger, getTotalImagesCount);
router.route("/search").get(logger, verifyJWTOPT, searchImages);
router.route("/advanced-search").get(logger, verifyJWTOPT, advancedSearch);
router.route("/discover").get(logger, verifyJWTOPT, discoverImages);
router.route("/downloadImage").post(logger, verifyJWT,verifiedMiddleware, downloadImage);
// GET /search?query=landscape&limit=10 - Text-based search
// GET /similar/:imageId?limit=10 - Find similar images
// GET /advanced-search?query=nature&tags=outdoor,landscape - Advanced filtering
// GET /discover?limit=10 - Random image discovery

export default router;
