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
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { uploadFile } from "../middlewares/multer.middleware.js";
import { MakePayment } from "../controllers/payment.controller.js";
import { logger } from "../utils/logger.js";

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

//secured routes
router.route("/logout").get(logger, verifyJWT, logoutUser);
router.route("/verify").post(logger, verifyJWT, verifyUser);
router
  .route("/resendVerificationToken")
  .get(logger, verifyJWT, resendVerificationToken);
router.route("/changeEmail").get(logger, verifyJWT, changeEmail);
router.route("/updateEmail").post(logger, verifyJWT, updateEmail);
router.route("/forgotUserName").post(logger, verifyJWT, forgotUserName);
router.route("/forgotEmail").post(logger, verifyJWT, forgotEmail);
router.route("/changeUserName").post(logger, verifyJWT, changeUserName);
router
  .route("/sendUpdatePasswordEmail")
  .post(logger, verifyJWT, sendUpdatePasswordEmail);
router.route("/updatePassword").post(logger, verifyJWT, updatePassword);
router.route("/deleteUser").delete(logger, verifyJWT, deleteUser);
router
  .route("/updateAvatar")
  .patch(logger, verifyJWT, uploadFile.array("files", 1), updateAvatar);
router.route("/getUserDetails").get(logger, verifyJWT, getUserDetails);
router.route("/payment").post(logger, verifyJWT, MakePayment);
export default router;
