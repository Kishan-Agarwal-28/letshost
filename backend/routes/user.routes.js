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
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { uploadFile } from "../middlewares/multer.middleware.js";
import { MakePayment } from "../controllers/payment.controller.js";

const router = Router();

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/generateNewTokens").post(generateNewTokens);
router.route("/oauth").get(registerOauthUser);
router.route("/auth/oauth/google/callback").get(handleGoogleOauthCallback);
router.route("/auth/oauth/github/callback").get(handleGithubOauthCallback);
router.route("/auth/oauth/spotify/callback").get(handleSpotifyOauthCallback);
router.route("/auth/oauth/facebook/callback").get(handleFacebookOauthCallback);
router
  .route("/auth/oauth/microsoft/callback")
  .get(handleMicrosoftOauthCallback);
router.route("/forgotPassword").post(forgotPassword);
router.route("/changePassword").post(changePassword);

//secured routes
router.route("/logout").get(verifyJWT, logoutUser);
router.route("/verify").post(verifyJWT, verifyUser);
router
  .route("/resendVerificationToken")
  .get(verifyJWT, resendVerificationToken);
router.route("/changeEmail").post(verifyJWT, changeEmail);
router.route("/updateEmail").post(verifyJWT, updateEmail);
router.route("/forgotUserName").post(verifyJWT, forgotUserName);
router.route("/forgotEmail").post(verifyJWT, forgotEmail);
router.route("/changeUserName").post(verifyJWT, changeUserName);
router
  .route("/updateAvatar")
  .patch(verifyJWT, uploadFile.array("avatar", 1), updateAvatar);
router.route("/getUserDetails").get(verifyJWT, getUserDetails);
router.route("/payment").post(verifyJWT, MakePayment);
export default router;
