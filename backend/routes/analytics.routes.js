import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getAnalytics, getFileTypeBreakdown, getTotalSizeByType } from "../controllers/analytics.controller.js";
import { logger } from "../utils/logger.js";
const router = Router();

router.route("/getAnalytics").get(logger,verifyJWT, getAnalytics);
router.route("/getFileTypeBreakdown").get(logger,verifyJWT, getFileTypeBreakdown);
router.route("/getTotalSizeByType").get(logger,verifyJWT, getTotalSizeByType);

export default router;