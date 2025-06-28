import asyncHandler from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { apiResponse } from "../utils/apiResponse.js";
import { Subs } from "../models/subs.model.js";
import mongoose from "mongoose";
import { Image } from "../models/gallery.model.js";
import {
  uploadOnCloudinary,
  deleteOnCloudinary,
} from "../services/cloudinary.service.js";

const registerCreator = asyncHandler(async (req, res) => {
  try {
    if (!req.user._id) {
      throw new apiError(400, "user id is required");
    }
    const user = await User.findById(req.user._id);
    if (!user) {
      throw new apiError(400, "User not found");
    }
    if (user.isCreator) {
      throw new apiError(400, "Already a creator");
    }
    user.isCreator = true;
    user.save({ validateBeforeSave: false });
    return res
      .status(200)
      .json(
        new apiResponse(200, user, "User successfully registered as Creator")
      );
  } catch (error) {
    throw new apiError(500, error.message);
  }
});

const updateCreatorFullName = asyncHandler(async (req, res) => {
  const { fullName } = req.body;
  try {
    const creator = await User.findById(req.user._id);
    if (!creator) {
      throw new apiError(400, "Creator not found");
    }
    if (!creator.isCreator) {
      throw new apiError(400, "Not a creator");
    }
    creator.fullName = fullName;
    await creator.save({ validateBeforeSave: false });
    return res
      .status(200)
      .json(
        new apiResponse(200, creator, "Creator full name updated successfully")
      );
  } catch (err) {
    throw new apiError(500, err.message);
  }
});
const updateCreatorDescription = asyncHandler(async (req, res) => {
  const { description } = req.body;
  try {
    const creator = await User.findById(req.user._id);
    if (!creator) {
      throw new apiError(400, "Creator not found");
    }
    if (!creator.isCreator) {
      throw new apiError(400, "Not a creator");
    }
    creator.description = description;
    await creator.save({ validateBeforeSave: false });
    return res
      .status(200)
      .json(
        new apiResponse(
          200,
          creator,
          "Creator description updated successfully"
        )
      );
  } catch (err) {
    throw new apiError(500, err.message);
  }
});
const updateCreatorCoverImage = asyncHandler(async (req, res) => {
  try {
    const creator = await User.findById(req.user._id).select(
      "-password -refreshToken "
    );
    if (!creator) {
      throw new apiError(404, "Creator not found");
    }
    if (!creator.isCreator) {
      throw new apiError(400, "Not a creator");
    }
    const oldCoverImageUrl = creator.coverImage;

    const coverImageLocalFilePath = req.files[0]?.path;
    if (!coverImageLocalFilePath) {
      throw new apiError(400, "Cover image is required");
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalFilePath);
    if (!coverImage.url) {
      throw new apiError(500, "Failed to upload cover image to cloudinary");
    }
    creator.coverImage = coverImage.url;
    await creator.save({ validateBeforeSave: false });
    await deleteOnCloudinary(oldCoverImageUrl);
    return res
      .status(200)
      .json(new apiResponse(200, creator, "Cover image updated successfully"));
  } catch (error) {
    throw new apiError(500, error.message);
  }
});
const updateCreatorLocation = asyncHandler(async (req, res) => {
  const { location } = req.body;
  try {
    if (!location) {
      throw new apiError(400, "Location is required");
    }
    const creator = await User.findById(req.user._id);
    if (!creator) {
      throw new apiError(400, "Creator not found");
    }
    if (!creator.isCreator) {
      throw new apiError(400, "Not a creator");
    }
    creator.location = location;
    await creator.save({ validateBeforeSave: false });
    return res
      .status(200)
      .json(
        new apiResponse(200, creator, "Creator location updated successfully")
      );
  } catch (err) {
    throw new apiError(500, err.message);
  }
});
const updateCreatorLinks = asyncHandler(async (req, res) => {
  const { link } = req.body;
  try {
    if (!(link && "socialPlatform" in link && "url" in link)) {
      throw new apiError(400, "Invalid link format");
    }
    const creator = await User.findById(req.user._id);
    if (!creator) {
      throw new apiError(400, "Creator not found");
    }
    if (!creator.isCreator) {
      throw new apiError(400, "Not a creator");
    }
    if (creator.links.includes(link)) {
      throw new apiError(400, "Link already exists");
    }
    creator.links = link;
    await creator.save({ validateBeforeSave: false });
    return res
      .status(200)
      .json(
        new apiResponse(200, creator, "Creator links updated successfully")
      );
  } catch (err) {
    throw new apiError(500, err.message);
  }
});
const updateCreatorDetails = asyncHandler(async (req, res) => {
  try {
    const { fullName, description, location, links } = req.body;

    const creator = await User.findById(req.user._id);
    if (!creator) {
      throw new apiError(400, "Creator not found");
    }
    if (!creator.isCreator) {
      throw new apiError(400, "Not a creator");
    }

    const updates = {};

    if (typeof fullName === "string" && fullName.trim()) {
      updates.fullName = fullName.trim();
    }
    if (typeof description === "string" && description.trim()) {
      updates.description = description.trim();
    }
    if (typeof location === "string" && location.trim()) {
      updates.location = location.trim();
    }
    if (Array.isArray(links) && links.length > 0) {
      updates.links = links;
    }

    if (Object.keys(updates).length === 0) {
      return res
        .status(400)
        .json(
          new apiResponse(400, null, "No valid fields provided for update")
        );
    }

    Object.assign(creator, updates);
    await creator.save({ validateBeforeSave: false });

    return res
      .status(200)
      .json(
        new apiResponse(200, creator, "Creator details updated successfully")
      );
  } catch (err) {
    throw new apiError(500, err.message);
  }
});

const followCreator = asyncHandler(async (req, res) => {
  const { creatorID } = req.body;
  let creatorId = req.user._id;
  if (creatorID !== "undefined") {
    creatorId = creatorID;
  }
  // Check if creator exists
  const creator = await User.findById(creatorId);
  if (!creator) {
    throw new apiError(404, "Creator not found");
  }

  const followerId = req.user._id;

  // Prevent users from following themselves
  if (creatorId.toString() === followerId.toString()) {
    console.log("creator", creatorId);
    console.log("follower", followerId);
    throw new apiError(400, "You cannot follow yourself");
  }

  // Check if already following
  const existingSubscription = await Subs.findOne({
    creator: creatorId,
    follower: followerId,
  });

  let action, message;

  if (existingSubscription) {
    // Unfollow: Remove existing subscription
    await Subs.findByIdAndDelete(existingSubscription._id);
    action = "unfollowed";
    message = "Creator unfollowed successfully";
  } else {
    // Follow: Add new subscription
    await Subs.create({
      creator: creatorId,
      follower: followerId,
    });
    action = "followed";
    message = "Creator followed successfully";
  }

  return res.status(200).json(
    new apiResponse(
      200,
      {
        action,
      },
      message
    )
  );
});

const getCreatorDetails = asyncHandler(async (req, res) => {
  try {
    if (!req.user._id) {
      throw new apiError(400, "User ID is required");
    }
    const creator = await User.aggregate([
      {
        $match: {
          $and: [
            { _id: new mongoose.Types.ObjectId(req.user._id) },
            { isCreator: true },
          ],
        },
      },
      {
        $lookup: {
          from: "subs",
          localField: "_id",
          foreignField: "creator",
          as: "followers",
        },
      },
      {
        $lookup: {
          from: "subs",
          localField: "_id",
          foreignField: "follower",
          as: "followings",
        },
      },
      {
        $addFields: {
          followersCount: { $size: "$followers" },
          followingCount: { $size: "$followings" },
        },
      },
      {
        $project: {
          _id: 1,
          username: 1,
          email: 1,
          avatar: 1,
          createdAt: 1,
          updatedAt: 1,
          followersCount: 1,
          followingCount: 1,
        },
      },
    ]);
    if (!creator) {
      throw new apiError(404, "Creator not found");
    }
    return res
      .status(200)
      .json(
        new apiResponse(200, creator[0], "Creator details fetched successfully")
      );
  } catch (error) {
    throw new apiError(500, error.message);
  }
});

const getCreatorStats = asyncHandler(async (req, res) => {
  try {
    let { creatorID } = req.query;
    if (!creatorID && !req.user?._id) {
      throw new apiError(400, "Creator ID is required");
    }
    if (creatorID === "undefined") {
      creatorID = req.user?._id;
    }
    if (creatorID === "undefined" && !req.user?._id) {
      throw new apiError(400, "Creator ID is required");
    }
    if (!mongoose.Types.ObjectId.isValid(creatorID)) {
      throw new apiError(400, "Invalid creator ID");
    }
    const creatorId = new mongoose.Types.ObjectId(creatorID);

    // Check if user is a creator
    const creator = await User.findOne({ _id: creatorId, isCreator: true });
    if (!creator) {
      throw new apiError(404, "Creator not found");
    }

    // Get comprehensive analytics
    const analytics = await Image.aggregate([
      {
        $match: { uploader: creatorId },
      },
      {
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "image",
          as: "imageLikes",
        },
      },
      {
        $lookup: {
          from: "saves",
          localField: "_id",
          foreignField: "image",
          as: "imageSaves",
        },
      },
      {
        $lookup: {
          from: "downloads",
          localField: "_id",
          foreignField: "image",
          as: "imageDownloads",
        },
      },
      {
        $addFields: {
          likesCount: { $size: "$imageLikes" },
          savesCount: { $size: "$imageSaves" },
          downloadsCount: { $size: "$imageDownloads" },
        },
      },
      {
        $group: {
          _id: null,
          totalImages: { $sum: 1 },
          totalLikes: { $sum: "$likesCount" },
          totalSaves: { $sum: "$savesCount" },
          totalDownloads: { $sum: "$downloadsCount" },
          avgLikesPerImage: { $avg: "$likesCount" },
          avgSavesPerImage: { $avg: "$savesCount" },
          avgDownloadsPerImage: { $avg: "$downloadsCount" },
        },
      },
    ]);

    // Get monthly aggregated data
    const monthlyStats = await Image.aggregate([
      {
        $match: { uploader: creatorId },
      },
      {
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "image",
          as: "imageLikes",
        },
      },
      {
        $lookup: {
          from: "saves",
          localField: "_id",
          foreignField: "image",
          as: "imageSaves",
        },
      },
      {
        $lookup: {
          from: "downloads",
          localField: "_id",
          foreignField: "image",
          as: "imageDownloads",
        },
      },
      {
        $addFields: {
          likesCount: { $size: "$imageLikes" },
          savesCount: { $size: "$imageSaves" },
          downloadsCount: { $size: "$imageDownloads" },
        },
      },
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
          },
          imagesCount: { $sum: 1 },
          totalLikes: { $sum: "$likesCount" },
          totalSaves: { $sum: "$savesCount" },
          totalDownloads: { $sum: "$downloadsCount" },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ]);

    // Get top performing images
    const topImages = await Image.aggregate([
      {
        $match: { uploader: creatorId },
      },
      {
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "image",
          as: "imageLikes",
        },
      },
      {
        $lookup: {
          from: "saves",
          localField: "_id",
          foreignField: "image",
          as: "imageSaves",
        },
      },
      {
        $lookup: {
          from: "downloads",
          localField: "_id",
          foreignField: "image",
          as: "imageDownloads",
        },
      },
      {
        $addFields: {
          likesCount: { $size: "$imageLikes" },
          savesCount: { $size: "$imageSaves" },
          downloadsCount: { $size: "$imageDownloads" },
          engagementScore: {
            $add: [
              { $multiply: [{ $size: "$imageLikes" }, 1] }, // likes weight: 1
              { $multiply: [{ $size: "$imageSaves" }, 2] }, // saves weight: 2
              { $multiply: [{ $size: "$imageDownloads" }, 3] }, // downloads weight: 3
            ],
          },
        },
      },
      {
        $sort: { engagementScore: -1 },
      },
      {
        $limit: 6,
      },
      {
        $project: {
          title: 1,
          imageUrl: 1,
          likesCount: 1,
          savesCount: 1,
          downloadsCount: 1,
          engagementScore: 1,
          createdAt: 1,
        },
      },
    ]);

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentActivity = await Image.aggregate([
      {
        $match: {
          uploader: creatorId,
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "image",
          as: "imageLikes",
        },
      },
      {
        $lookup: {
          from: "saves",
          localField: "_id",
          foreignField: "image",
          as: "imageSaves",
        },
      },
      {
        $lookup: {
          from: "downloads",
          localField: "_id",
          foreignField: "image",
          as: "imageDownloads",
        },
      },
      {
        $group: {
          _id: null,
          recentImages: { $sum: 1 },
          recentLikes: { $sum: { $size: "$imageLikes" } },
          recentSaves: { $sum: { $size: "$imageSaves" } },
          recentDownloads: { $sum: { $size: "$imageDownloads" } },
        },
      },
    ]);

    // Get follower growth data
    const followerGrowth = await Subs.aggregate([
      {
        $match: { creator: creatorId },
      },
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
          },
          newFollowers: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ]);
    // Get followers and following count
    const followersCount = await mongoose
      .model("subs")
      .countDocuments({ creator: creatorId });
    const followingCount = await mongoose
      .model("subs")
      .countDocuments({ follower: creatorId });

    const result = {
      overview: analytics[0] || {
        totalImages: 0,
        totalLikes: 0,
        totalSaves: 0,
        totalDownloads: 0,
        avgLikesPerImage: 0,
        avgSavesPerImage: 0,
        avgDownloadsPerImage: 0,
      },
      monthlyStats,
      topImages,
      recentActivity: recentActivity[0] || {
        recentImages: 0,
        recentLikes: 0,
        recentSaves: 0,
        recentDownloads: 0,
      },
      followerGrowth,
      creatorInfo: {
        _id: creatorID,
        username: creator.username,
        email: creator.email,
        fullName: creator.fullName || creator.username,
        description: creator.description || "",
        location: creator.location || "",
        avatar: creator.avatar,
        coverImage: creator.coverImage || "",
        links: creator.links || [],
        createdAt: creator.createdAt,
      },
      followersCount,
      followingCount,
    };

    return res
      .status(200)
      .json(
        new apiResponse(200, result, "Creator analytics fetched successfully")
      );
  } catch (error) {
    throw new apiError(500, error.message);
  }
});

export {
  registerCreator,
  updateCreatorFullName,
  updateCreatorDescription,
  updateCreatorCoverImage,
  updateCreatorLocation,
  updateCreatorLinks,
  followCreator,
  getCreatorDetails,
  getCreatorStats,
  updateCreatorDetails,
};
