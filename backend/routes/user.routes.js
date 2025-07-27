import { Router } from "express";
import {
  registerUser,
  registerOauthUser,
  loginUser,
  logoutUser,
  generateNewTokens,
  verifyUser,
  forgotPassword,
  changePassword,
  resendVerificationToken,
  changeEmail,
  updateEmail,
  forgotUserName,
  forgotEmail,
  changeUserName,
  updateAvatar,
  handleGoogleOauthCallback,
  handleGithubOauthCallback,
  handleSpotifyOauthCallback,
  handleFacebookOauthCallback,
  handleMicrosoftOauthCallback,
  getUserDetails,
  sendUpdatePasswordEmail,
  updatePassword,
  deleteUser,
  initialize2FA,
  verify2FA,
  verify2FALogin,
  checkPassword,
  disable2FA,
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { uploadFile } from "../middlewares/multer.middleware.js";
import { MakePayment } from "../controllers/payment.controller.js";
import { logger } from "../utils/logger.js";
import rateLimit from "express-rate-limit";
import { verifiedMiddleware } from "../middlewares/verified.middleware.js";

const router = Router();

router.route("/register").post(logger, registerUser);
router.route("/login").post(logger, loginUser);
router.route("/generateNewTokens").post(logger, generateNewTokens);
router.route("/oauth").get(logger, registerOauthUser);
router
  .route("/auth/oauth/google/callback")
  .get(logger, handleGoogleOauthCallback);
router
  .route("/auth/oauth/github/callback")
  .get(logger, handleGithubOauthCallback);
router
  .route("/auth/oauth/spotify/callback")
  .get(logger, handleSpotifyOauthCallback);
router
  .route("/auth/oauth/facebook/callback")
  .get(logger, handleFacebookOauthCallback);
router
  .route("/auth/oauth/microsoft/callback")
  .get(logger, handleMicrosoftOauthCallback);
router.route("/forgotPassword").post(logger, forgotPassword);
router.route("/changePassword").post(logger, changePassword);
router.route("/verify2FALogin").post(logger, verify2FALogin)
router.route("/forgotUserName").post(logger,  forgotUserName);
router.route("/forgotEmail").post(logger, forgotEmail);

//secured routes
router.route("/logout").get(logger, verifyJWT, logoutUser);
router.route("/verify").post(logger, verifyUser);
router
  .route("/resendVerificationToken")
  .get(logger,
    rateLimit({
      windowMs:60*1000*60,
      max:3,
      message:{
        message:"Too many attempts Please try again after an hour You can only make 3 attempts per hour",
      },
      standardHeaders: true,
    legacyHeaders: false,
    }),
     verifyJWT, resendVerificationToken);
router.route("/changeEmail").get(logger, verifyJWT,verifiedMiddleware, changeEmail);
router.route("/updateEmail").post(logger, verifyJWT,verifiedMiddleware, updateEmail);
router.route("/changeUserName").post(logger, verifyJWT,verifiedMiddleware, changeUserName);
router
  .route("/sendUpdatePasswordEmail")
  .post(logger, verifyJWT,verifiedMiddleware, sendUpdatePasswordEmail);
router.route("/updatePassword").post(logger, verifyJWT,verifiedMiddleware, updatePassword);
router.route("/deleteUser").delete(logger, verifyJWT,verifiedMiddleware, deleteUser);
router
  .route("/updateAvatar")
  .patch(logger, verifyJWT,verifiedMiddleware, uploadFile.array("files", 1), updateAvatar);
router.route("/getUserDetails").get(logger, verifyJWT,verifiedMiddleware, getUserDetails);
router.route("/initialize2FA").post(logger,verifyJWT, verifiedMiddleware,initialize2FA)
router.route("/verify2FA").post(logger,verifyJWT,verifiedMiddleware, verify2FA)
router.route("/getUserDetails").get(logger,verifyJWT,getUserDetails)
router.route("/checkPassword").post(logger,verifyJWT,checkPassword)
router.route("/disable2FA").post(logger,verifyJWT,verifiedMiddleware,disable2FA)
router.route("/payment").post(logger, verifyJWT,verifiedMiddleware, MakePayment);
export default router;
