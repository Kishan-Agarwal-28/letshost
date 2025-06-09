import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  uploadFile,
  captureRelativePaths,
} from "../middlewares/multer.middleware.js";
import {
  registerSubDomain,
  updateSubDomain,
  deleteSubDomain,
  changeSubDomainContents,
  getUploadSignedUrl,
  getSubDomainContents,
  updateSubDomainVisibility,
  getViewSignedUrl,
} from "../controllers/subdomain.controller.js";
const router = Router();
router
  .route("/register")
  .post(
    verifyJWT,
    captureRelativePaths,
    uploadFile.array("files", 400),
    registerSubDomain
  );
router.route("/update").post(verifyJWT, updateSubDomain);
router.route("/delete").post(verifyJWT, deleteSubDomain);
router
  .route("/changecontents")
  .post(
    verifyJWT,
    captureRelativePaths,
    uploadFile.array("files", 400),
    changeSubDomainContents
  );
router.route("/getuploadsignedurl").post(verifyJWT, getUploadSignedUrl);
router.route("/getcontents").post(verifyJWT, getSubDomainContents);
router.route("/updatevisibility").post(verifyJWT, updateSubDomainVisibility);
router.route("/getviewsignedurl").post(verifyJWT, getViewSignedUrl);

export default router;
