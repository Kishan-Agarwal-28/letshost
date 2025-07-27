import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  getAnalytics,
  getFileTypeBreakdown,
  getTotalSizeByType,
} from "../controllers/analytics.controller.js";
import { logger } from "../utils/logger.js";
import { verifiedMiddleware } from "../middlewares/verified.middleware.js";
const router = Router();

router.route("/getAnalytics").get(logger, verifyJWT,verifiedMiddleware, getAnalytics);
router
  .route("/getFileTypeBreakdown")
  .get(logger, verifyJWT,verifiedMiddleware, getFileTypeBreakdown);
router.route("/getTotalSizeByType").get(logger, verifyJWT,verifiedMiddleware, getTotalSizeByType);

export default router;
