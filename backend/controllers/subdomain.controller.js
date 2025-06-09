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
const formatSubdomainKey = (subdomain) => `user_${subdomain}`;

const cacheSubDomain = async (subdomain, projectID, owner) => {
  const key = formatSubdomainKey(subdomain);
  const subdomainData = { owner, projectID };
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
        subD.owner._id
      );
      return subD;
    }
  } catch (error) {
    throw new Error(error.message || "Failed to get subdomain");
  }
};

// Create a new subdomain
const registerSubDomain = asyncHandler(async (req, res) => {
  let { subDomain } = req.body;
  subDomain = subDomain.toLowerCase();
  const owner = req.user._id;

  if (!subDomain) {
    subDomain = generateSlug({ format: "kebab", parts: 2 });
  }

  const existing = await getSubDomain(subDomain);
  if (existing) {
    const tempPath = path.join(
      process.cwd(),
      "public",
      "temp",
      req.user._id.toString()
    );
    await fs.rm(tempPath, { recursive: true, force: true });

    throw new apiError(400, "Subdomain already exists");
  }

  const projectID = nanoid(10).toLowerCase();
  const user = await User.findById(owner);

  if (user.SDLimit == 0) {
    const tempPath = path.join(
      process.cwd(),
      "public",
      "temp",
      req.user._id.toString()
    );

    await fs.rm(tempPath, { recursive: true, force: true });

    throw new apiError(400, "You have reached your limit of subdomains");
  } else {
    const tempPath = path.join(
      process.cwd(),
      "public",
      "temp",
      req.user._id.toString()
    );

    if (FS.existsSync(tempPath)) {
      await uploadToS3(owner, projectID);
    }
  }
  const subdomain = await SubDomain.create({
    subDomain,
    owner,
    projectID,
  });

  await cacheSubDomain(subDomain, projectID.toLowerCase(), owner);
  user.SDLimit = user.SDLimit - 1;
  await user.save();

  return res
    .status(200)
    .json(new apiResponse(200, subdomain, "Subdomain registered successfully"));
});

// Update a subdomain (change its name)
const updateSubDomain = asyncHandler(async (req, res) => {
  const { oldSubDomain, newSubDomain } = req.body;
  const owner = req.user._id;

  if (!newSubDomain) {
    throw new apiError(400, "New subdomain is required");
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
    await cacheSubDomain(newSubDomain, subdomainRecord.projectID, owner);

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
  const projectID = existing.projectID;
  await deleteObjects(`${existing.owner.toString()}/${projectID}`);
  await uploadToS3(owner, projectID);

  return res
    .status(200)
    .json(
      new apiResponse(200, existing, "Subdomain contents changed successfully")
    );
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
