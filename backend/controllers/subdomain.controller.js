import asyncHandler from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { SubDomain } from "../models/subdomain.model.js";
import { User } from "../models/user.model.js";
import { redis } from "../db/connectRedis.js";
import { apiResponse } from "../utils/apiResponse.js";
import { REDIS_EXP } from "../constants.js";
import { nanoid } from "nanoid";
import {
  deleteObjects,
  uploadToS3,
  upload,
  listObjects,
} from "../services/awsS3.service.js";
import { generateSlug } from "random-word-slugs";
import jwt from "jsonwebtoken";
import fs from "fs/promises";
import path from "path";
import FS from "fs";
import { Pricing } from "../models/pricing.model.js";
const formatSubdomainKey = (subdomain) => `user_${subdomain}`;

const cacheSubDomain = async (subdomain, projectID, owner, Ispublic) => {
  const key = formatSubdomainKey(subdomain);
  const subdomainData = { owner, projectID, Ispublic };
  if (redis.get(key)) {
    await redis.del(key);
  }
  await redis.set(key, JSON.stringify(subdomainData), "PX", REDIS_EXP);
};

const getSubDomain = async (subdomain) => {
  const key = formatSubdomainKey(subdomain);
  try {
    const subdomainData = await redis.get(key);
    if (subdomainData) {
      return JSON.parse(subdomainData);
    } else {
      const subD = await SubDomain.findOne({ subDomain: subdomain });
      if (!subD) return null;
      await cacheSubDomain(
        subD.subDomain.replace(/^user_/, ""),
        subD.projectID,
        subD.owner._id,
        subD.public
      );
      return subD;
    }
  } catch (error) {
    throw new Error(error.message || "Failed to get subdomain");
  }
};
async function getFolderSize(folderPath) {
  try {
    const files = await fs.readdir(folderPath, {
      recursive: true,
      withFileTypes: true,
    });
    let totalSize = 0;

    for (const file of files) {
      if (file.isFile()) {
        const filePath = path.join(file.path || folderPath, file.name);
        const stats = await fs.stat(filePath);
        totalSize += stats.size;
      }
    }

    return totalSize;
  } catch (error) {
    throw new Error(`Error calculating folder size: ${error.message}`);
  }
}
const restrictedSubdomains = [
  "www",
  "api",
  "admin",
  "blog",
  "dashboard",
  "support",
  "help",
  "contact",
  "about",
  "terms",
  "privacy",
  "legal",
  "status",
  "docs",
  "forum",
  "login",
  "register",
  "signin",
  "signup",
  "logout",
  "home",
  "index",
  "store",
  "shop",
  "cart",
  "assets",
  "static",
  "public",
  "images",
  "files",
  "media",
  "uploads",
  "temp",
  "resources",
  "http",
  "https",
  "localhost",
  "example",
  "demo",
  "test",
  "staging",
  "dev",
  "testbed",
  "preview",
  "internal",
  "secure",
  "cms",
  "panel",
  "adminpanel",
  "control",
  "auth",
  "oauth",
  "identity",
  "loginpage",
  "logoutpage",
  "error",
  "maintenance",
  "billing",
  "checkout",
  "payments",
  "order",
  "user",
  "profile",
  "account",
  "newsletter",
  "cartpage",
  "assets",
  "cdn",
  "download",
  "uploads",
  "resources",
  "server",
  "monitoring",
  "data",
  "platform",
  "api-v1",
  "api-v2",
  "api-v3",
  "api-beta",
  "adminapi",
  "authapi",
  "secureapi",
  "hooks",
  "ping",
  "verify",
  "robots",
  "sitemap",
  "notifications",
  "messaging",
  "uploads",
  "imageserver",
  "content",
  "mediafiles",
  "resources",
  "downloadfiles",
  "testing",
  "console",
  "cli",
  "toolbox",
  "tool",
  "scripts",
  "cloud",
  "supportcenter",
  "feedback",
  "tickets",
  "audit",
  "logs",
  "alert",
  "monitoring",
  "statuspage",
  "incident",
  "release",
  "updates",
  "live",
  "statuspage",
  "supportchat"
];

// Create a new subdomain
const registerSubDomain = asyncHandler(async (req, res) => {
  let { subDomain } = req.body;
  subDomain = subDomain?.toLowerCase();
  const owner = req.user._id;

  if (!subDomain) {
    subDomain = generateSlug({ format: "kebab", parts: 2 });
  }
  if( restrictedSubdomains.includes(subDomain)) {
    throw new apiError(400, "This subdomain is restricted, please choose another one");
  }
  const existing = await getSubDomain(subDomain);
  if (existing) {
    const tempPath = path.join(
      process.cwd(),
      "public",
      "temp",
      req.user._id.toString()
    );
    if (FS.existsSync(tempPath)) {
      await fs.rm(tempPath, { recursive: true, force: true });
    }
    throw new apiError(400, "Subdomain already exists");
  }

  const projectID = nanoid(10).toLowerCase();
  const user = await User.findById(owner);
  const pricing = await Pricing.findOne({ tier: user.tier });

  if (!pricing) {
    throw new apiError(500, "Pricing configuration not found");
  }

  if (user.SDLimit === 0) {
    const tempPath = path.join(
      process.cwd(),
      "public",
      "temp",
      req.user._id.toString()
    );
    if (FS.existsSync(tempPath)) {
      await fs.rm(tempPath, { recursive: true, force: true });
    }
    throw new apiError(400, "You have reached your limit of subdomains");
  }

  const tempPath = path.join(
    process.cwd(),
    "public",
    "temp",
    req.user._id.toString()
  );

  if (FS.existsSync(tempPath)) {
    const folderSize = await getFolderSize(tempPath);
    const totalSize = folderSize + user.fileLimit;

    if (totalSize > pricing.fileLimit) {
      await fs.rm(tempPath, { recursive: true, force: true });
      throw new apiError(
        400,
        "You have reached your limit of files size for your account"
      );
    }

    user.fileLimit += folderSize;
    await uploadToS3(owner, projectID);
    await fs.rm(tempPath, { recursive: true, force: true });

    const subdomain = await SubDomain.create({
      subDomain,
      owner,
      projectID,
      fileSize: folderSize,
    });

    await cacheSubDomain(
      subDomain,
      projectID.toLowerCase(),
      owner,
      subdomain.public
    );
    user.SDLimit = user.SDLimit - 1;
    await user.save();
    return res
      .status(200)
      .json(
        new apiResponse(200, subdomain, "Subdomain registered successfully")
      );
  } else {
    throw new apiError(400, "Error uploading files to server");
  }
});

// Update a subdomain (change its name)
const updateSubDomain = asyncHandler(async (req, res) => {
  const { oldSubDomain, newSubDomain } = req.body;
  const owner = req.user._id;

  if (!newSubDomain) {
    throw new apiError(400, "New subdomain is required");
  }
if( restrictedSubdomains.includes(newSubDomain)) {
    throw new apiError(400, "This subdomain is restricted, please choose another one");
  }
  const existing = await getSubDomain(newSubDomain);
  if (existing) {
    throw new apiError(400, "Subdomain already exists, try another one");
  }
  try {
    const subdomainRecord = await SubDomain.findOne({
      subDomain: oldSubDomain,
    });
    if (!subdomainRecord) {
      throw new apiError(400, "No subdomain found for the current user");
    }
    if (subdomainRecord.owner.toString() !== owner.toString()) {
      throw new apiError(403, "Unauthorized: You don't own this subdomain");
    }

    subdomainRecord.subDomain = newSubDomain;
    await subdomainRecord.save();

    const oldKey = formatSubdomainKey(oldSubDomain);
    const getOldKeyDataRedis = await redis.get(oldKey);
    if (getOldKeyDataRedis) {
      await redis.del(oldKey);
    }
    await cacheSubDomain(
      newSubDomain,
      subdomainRecord.projectID,
      owner,
      subdomainRecord.public
    );

    return res
      .status(200)
      .json(
        new apiResponse(200, subdomainRecord, "Subdomain updated successfully")
      );
  } catch (error) {
    console.error("Error updating subdomain:", error);
    throw new apiError(500, "Internal server error");
  }
});

const changeSubDomainContents = asyncHandler(async (req, res) => {
  const { subDomain } = req.body;
  const owner = req.user._id;

  if (!subDomain) {
    throw new apiError(400, "Subdomain is required");
  }

  const existing = await getSubDomain(subDomain);
  if (!existing) {
    throw new apiError(400, "Subdomain does not exist");
  }

  if (existing.owner.toString() !== owner.toString()) {
    throw new apiError(403, "Unauthorized: You don't own this subdomain");
  }

  const tempPath = path.join(
    process.cwd(),
    "public",
    "temp",
    req.user._id.toString()
  );

  let folderSize = 0;
  let user = null;
  let originalFileLimit = 0;

  // Check if temp folder exists and validate limits
  if (FS.existsSync(tempPath)) {
    user = await User.findById(owner);
    const pricing = await Pricing.findOne({ tier: user.tier });

    if (!pricing) {
      throw new apiError(500, "Pricing configuration not found");
    }

    folderSize = await getFolderSize(tempPath);
    const totalSize = folderSize + user.fileLimit - existing.fileSize;

    if (totalSize > pricing.fileLimit) {
      await fs.rm(tempPath, { recursive: true, force: true });
      throw new apiError(
        400,
        "You have reached your limit of files size for your account"
      );
    }

    // Store original limit for potential rollback
    originalFileLimit = user.fileLimit;
    user.fileLimit = totalSize;
    await user.save();
  }

  const projectID = existing.projectID;

  try {
    await deleteObjects(`${existing.owner.toString()}/${projectID}`);
    await uploadToS3(owner, projectID);

    // Clean up temp folder after successful upload
    if (FS.existsSync(tempPath)) {
      await fs.rm(tempPath, { recursive: true, force: true });
    }
    existing.fileSize = folderSize;
    await existing.save();
    return res
      .status(200)
      .json(
        new apiResponse(
          200,
          existing,
          "Subdomain contents changed successfully"
        )
      );
  } catch (error) {
    // Rollback user fileLimit if it was updated
    if (user && folderSize > 0) {
      user.fileLimit = originalFileLimit;
      await user.save();
    }

    // Clean up temp folder on error
    if (FS.existsSync(tempPath)) {
      await fs.rm(tempPath, { recursive: true, force: true });
    }
    throw error;
  }
});

// Delete a subdomain
const deleteSubDomain = asyncHandler(async (req, res) => {
  const { subDomain } = req.body;
  const owner = req.user.id;
  const formattedSubdomain = formatSubdomainKey(subDomain);
  if (!subDomain) {
    throw new apiError(400, "Subdomain is required");
  }

  const subdomain = await SubDomain.findOne({ subDomain });

  if (!subdomain) {
    throw new apiError(400, "Subdomain does not exist");
  }

  if (subdomain.owner.toString() !== owner) {
    throw new apiError(403, "Unauthorized: You don't own this subdomain");
  }

  await SubDomain.deleteOne({ subDomain });
  const user = await User.findById(owner);
  user.SDLimit = user.SDLimit + 1;
  user.fileLimit = Math.max(user.fileLimit - subdomain.fileSize, 0);
  await user.save();
  const getOldKeyDataRedis = await redis.get(formattedSubdomain);
  if (getOldKeyDataRedis) {
    await redis.del(formattedSubdomain);
  }
  await deleteObjects(`${subdomain.owner.toString()}/${subdomain.projectID}`);

  return res
    .status(200)
    .json(new apiResponse(200, subdomain, "Subdomain deleted successfully"));
});
const getUploadSignedUrl = asyncHandler(async (req, res) => {
  const { subDomain } = req.body;
  const owner = req.user._id;
  if (!subDomain) {
    throw new apiError(400, "Subdomain is required");
  }
  const existing = await getSubDomain(subDomain);
  if (!existing) {
    throw new apiError(400, "Subdomain does not exist");
  }
  if (existing.owner.toString() !== owner.toString()) {
    throw new apiError(403, "Unauthorized: You don't own this subdomain");
  }
  const projectID = existing.projectID;
  const uploadUrl = await upload(owner, projectID);

  if (!uploadUrl) {
    throw new apiError(500, "Failed to generate upload URL");
  }
  return res
    .status(200)
    .json(new apiResponse(200, uploadUrl, "Upload URL generated successfully"));
});
const getSubDomainContents = asyncHandler(async (req, res) => {
  const { subDomain } = req.body;
  const owner = req.user._id;
  if (!subDomain) {
    throw new apiError(400, "Subdomain is required");
  }
  const existing = await getSubDomain(subDomain);
  if (!existing) {
    throw new apiError(400, "Subdomain does not exist");
  }
  if (existing.owner.toString() !== owner.toString()) {
    throw new apiError(403, "Unauthorized: You don't own this subdomain");
  }
  const projectID = existing.projectID;
  const contents = await listObjects(`${owner}/${projectID}`);
  if (!contents) {
    throw new apiError(500, "Failed to fetch subdomain contents");
  }
  return res
    .status(200)
    .json(
      new apiResponse(200, contents, "Subdomain contents fetched successfully")
    );
});
const updateSubDomainVisibility = asyncHandler(async (req, res) => {
  const { subDomain, visibility } = req.body;
  const owner = req.user._id;
  if (!subDomain) {
    throw new apiError(400, "Subdomain is required");
  }
  const existing = await SubDomain.findOne({ subDomain });
  if (!existing) {
    throw new apiError(400, "Subdomain does not exist");
  }
  if (existing.owner.toString() !== owner.toString()) {
    throw new apiError(403, "Unauthorized: You don't own this subdomain");
  }
  if (visibility === "public") {
    existing.public = true;
  } else {
    existing.public = false;
  }
  await cacheSubDomain(
    existing.subDomain,
    existing.projectID,
    owner,
    existing.public
  );
  await existing.save();
  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        existing,
        "Subdomain visibility updated successfully"
      )
    );
});
const getViewSignedUrl = asyncHandler(async (req, res) => {
  const { subDomain } = req.body;
  const owner = req.user._id;
  if (!subDomain) {
    throw new apiError(400, "Subdomain is required");
  }
  const existing = await SubDomain.findOne({ subDomain });
  if (!existing) {
    throw new apiError(400, "Subdomain does not exist");
  }
  if (existing.owner.toString() !== owner.toString()) {
    throw new apiError(403, "Unauthorized: You don't own this subdomain");
  }

  let ViewUrl = `${existing.subDomain}.lethost.dpdns.org`;
  if (existing.public === false) {
    const token = jwt.sign(
      {
        sub: existing.subDomain,
      },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
      }
    );
    ViewUrl = `${existing.subDomain}.lethost.dpdns.org/?token=${token}`;
  }
  await cacheSubDomain(
    existing.subDomain,
    existing.projectID,
    owner,
    existing.public
  );
  return res
    .status(200)
    .json(
      new apiResponse(200, ViewUrl, "View signed URL generated successfully")
    );
});
export {
  registerSubDomain,
  updateSubDomain,
  deleteSubDomain,
  changeSubDomainContents,
  getUploadSignedUrl,
  getSubDomainContents,
  updateSubDomainVisibility,
  getViewSignedUrl,
};
