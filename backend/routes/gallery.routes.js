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

const router = Router();

router.route("/addToGallery").post(logger, verifyJWT, addToGallery);
router.route("/likeImage").post(logger, verifyJWT, likeImage);
router.route("/saveImage").post(logger, verifyJWT, saveImage);
router.route("/deleteImage").post(logger, verifyJWT, deleteImage);
router.route("/getImagesOfUser").get(logger, verifyJWT, getImagesOfUser);
router.route("/getGallery").get(logger, verifyJWTOPT, getGallery);
router.route("/getTotalImagesCount").get(logger, getTotalImagesCount);
router.route("/search").get(logger, verifyJWT, searchImages);
router.route("/advanced-search").get(logger, verifyJWT, advancedSearch);
router.route("/discover").get(logger, verifyJWT, discoverImages);
router.route("/downloadImage").post(logger, verifyJWT, downloadImage);
// GET /search?query=landscape&limit=10 - Text-based search
// GET /similar/:imageId?limit=10 - Find similar images
// GET /advanced-search?query=nature&tags=outdoor,landscape - Advanced filtering
// GET /discover?limit=10 - Random image discovery

export default router;
