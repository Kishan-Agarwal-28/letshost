import asyncHandler from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { Image } from "../models/gallery.model.js";
import { User } from "../models/user.model.js";
import { commitImageToGallery } from "../services/cloudinary.service.js";
import { apiResponse } from "../utils/apiResponse.js";
import mongoose from "mongoose";
import {
  searchSimilarImages,
  findSimilarImagesById,
  advancedImageSearch,
  getRandomImages,
} from "../services/quad.service.js";
import { Like } from "../models/likes.model.js";
import { Save } from "../models/saves.model.js";
import { Download } from "../models/downloads.model.js";

const addToGallery = asyncHandler(async (req, res) => {
  const { public_id } = req.body;
  if (!req.user._id) {
    throw new apiError(400, "User ID is required");
  }
  if (!public_id) {
    throw new apiError(400, "Public ID is required");
  }
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      throw new apiError(404, "User not found");
    }
    const image = await Image.findOne({ public_id });
    await commitImageToGallery(public_id);
    if (!image.uploaded) {
      image.uploaded = true;
      user.genCredits += 0.5;
    } else {
      throw new apiError(400, "Image already contributed");
    }
    await user.save();
    await image.save();
    return res
      .status(200)
      .json(new apiResponse(200, image, "Image uploaded successfully"));
  } catch (error) {
    throw new apiError(500, error.message);
  }
});

const likeImage = asyncHandler(async (req, res) => {
  const { imageId } = req.body;

  try {
    const image = await Image.findById(imageId);
    if (!image) {
      throw new apiError(404, "Image not found");
    }

    const userId = req.user._id;
    const isOwnImage = image.uploader.toString() === userId.toString();

    // Check if user already liked the image
    const existingLike = await Like.findOne({
      image: imageId,
      likedBy: userId,
    });

    let action, message;

    if (existingLike) {
      // Unlike: Remove existing like
      await Like.findByIdAndDelete(existingLike._id);
      action = "unliked";
      message = "Image unliked successfully";

      // Credit management for uploader (not for own images)
      if (!isOwnImage) {
        const uploader = await User.findById(image.uploader);
        uploader.genCredits = Math.max(0, uploader.genCredits - 0.1);
        await uploader.save();
      }
    } else {
      // Like: Add new like
      await Like.create({
        image: imageId,
        likedBy: userId,
      });
      action = "liked";
      message = "Image liked successfully";

      // Credit management for uploader (not for own images)
      if (!isOwnImage) {
        const uploader = await User.findById(image.uploader);

        // Count total likes for this image
        const totalLikes = await Like.countDocuments({ image: imageId });

        // Add 1 credit for every 10 likes
        if (totalLikes % 10 === 0) {
          uploader.genCredits += 1;
          await uploader.save();
        }
      }
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
  } catch (error) {
    throw new apiError(500, error.message);
  }
});

const saveImage = asyncHandler(async (req, res) => {
  const { imageId } = req.body;

  try {
    const image = await Image.findById(imageId);
    if (!image) {
      throw new apiError(404, "Image not found");
    }

    const userId = req.user._id;

    // Check if user already saved the image
    const existingSave = await Save.findOne({
      image: imageId,
      savedBy: userId,
    });

    let action, message;

    if (existingSave) {
      // Unsave: Remove existing save
      await Save.findByIdAndDelete(existingSave._id);
      action = "unsaved";
      message = "Image unsaved successfully";
    } else {
      // Save: Add new save
      await Save.create({
        image: imageId,
        savedBy: userId,
      });
      action = "saved";
      message = "Image saved successfully";
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
  } catch (error) {
    throw new apiError(500, error.message);
  }
});

const downloadImage = asyncHandler(async (req, res) => {
  const { imageId } = req.body;

  try {
    const image = await Image.findById(imageId);
    if (!image) {
      throw new apiError(404, "Image not found");
    }

    const userId = req.user._id;

    // Add download record
    await Download.create({
      image: imageId,
      downloadedBy: userId,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get("User-Agent"),
    });
    return res.status(200).json(
      new apiResponse(
        200,
        {
          imageUrl: image.imageUrl,
        },
        "Image download tracked successfully"
      )
    );
  } catch (error) {
    throw new apiError(500, error.message);
  }
});

const deleteImage = asyncHandler(async (req, res) => {
  const { imageId } = req.body;

  try {
    const image = await Image.findById(imageId);
    if (!image) {
      throw new apiError(404, "Image not found");
    }

    // Check if user is the uploader
    if (image.uploader.toString() !== req.user._id.toString()) {
      throw new apiError(403, "You can only delete your own images");
    }

    // Deduct 2 credits from user for deleting
    const user = await User.findById(req.user._id);
    user.genCredits = Math.max(0, user.genCredits - 2);
    await user.save();

    // Delete the image
    await Image.findByIdAndDelete(imageId);

    return res
      .status(200)
      .json(
        new apiResponse(
          200,
          null,
          "Image deleted successfully. 2 credits deducted."
        )
      );
  } catch (error) {
    throw new apiError(500, error.message);
  }
});

const getImagesOfUser = asyncHandler(async (req, res) => {
  const { limit = 10, page = 1 } = req.query;
  const limitNum = parseInt(limit, 10);
  const pageNum = parseInt(page, 10);
  const { creatorId } = req.query;

  let id = req.user._id;
  if (creatorId !== "undefined") {
    id = creatorId;
  }

  const user = await User.findById(id);
  if (!user) {
    throw new apiError(404, "User not found");
  }

  const totalImages = await Image.countDocuments({ uploader: id });

  const images = await Image.aggregate([
    {
      $match: { uploader: new mongoose.Types.ObjectId(id) },
    },
    {
      $lookup: {
        from: "users",
        localField: "uploader",
        foreignField: "_id",
        as: "uploader",
        pipeline: [
          {
            $project: {
              username: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "likes", // Make sure collection name matches your model
        localField: "_id",
        foreignField: "image",
        as: "likes",
      },
    },
    {
      $lookup: {
        from: "saves", // Make sure collection name matches your model
        localField: "_id",
        foreignField: "image",
        as: "saves",
      },
    },
    {
      $lookup: {
        from: "downloads",
        localField: "_id",
        foreignField: "image",
        as: "downloads",
      },
    },
    {
      $addFields: {
        uploader: { $first: "$uploader" },
        likesCount: { $size: "$likes" },
        savesCount: { $size: "$saves" },
        downloadsCount: { $size: "$downloads" },
        // Fixed: Check if current user's ID exists in the likes array
        isLikedByUser:
          req.user && req.user._id
            ? {
                $in: [
                  new mongoose.Types.ObjectId(req.user._id),
                  "$likes.likedBy",
                ],
              }
            : false,
        // Fixed: Check if current user's ID exists in the saves array
        isSavedByUser:
          req.user && req.user._id
            ? {
                $in: [
                  new mongoose.Types.ObjectId(req.user._id),
                  "$saves.savedBy",
                ],
              }
            : false,
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $skip: limitNum * (pageNum - 1),
    },
    {
      $limit: limitNum,
    },
  ]);

  const totalPages = Math.ceil(totalImages / limitNum);
  const hasNextPage = pageNum < totalPages;
  const hasPreviousPage = pageNum > 1;

  return res.status(200).json(
    new apiResponse(
      200,
      {
        images,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalImages,
          hasNextPage,
          hasPreviousPage,
          limit: limitNum,
        },
      },
      "User gallery fetched successfully"
    )
  );
});
const getImagesHistoryOfUser = asyncHandler(async (req, res) => {
  const { limit = 10, page = 1 } = req.query;
  const limitNum = parseInt(limit, 10);
  const pageNum = parseInt(page, 10);

  let id = req.user._id;


  const user = await User.findById(id);
  if (!user) {
    throw new apiError(404, "User not found");
  }

  const totalImages = await Image.countDocuments({ uploader: id });

  const images = await Image.aggregate([
    {
      $match: { uploader: new mongoose.Types.ObjectId(id) },
    },
    {
      $lookup: {
        from: "users",
        localField: "uploader",
        foreignField: "_id",
        as: "uploader",
        pipeline: [
          {
            $project: {
              username: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "likes", // Make sure collection name matches your model
        localField: "_id",
        foreignField: "image",
        as: "likes",
      },
    },
    {
      $lookup: {
        from: "saves", // Make sure collection name matches your model
        localField: "_id",
        foreignField: "image",
        as: "saves",
      },
    },
    {
      $lookup: {
        from: "downloads",
        localField: "_id",
        foreignField: "image",
        as: "downloads",
      },
    },
    {
      $addFields: {
        uploader: { $first: "$uploader" },
        likesCount: { $size: "$likes" },
        savesCount: { $size: "$saves" },
        downloadsCount: { $size: "$downloads" },
        // Fixed: Check if current user's ID exists in the likes array
        isLikedByUser:
          req.user && req.user._id
            ? {
                $in: [
                  new mongoose.Types.ObjectId(req.user._id),
                  "$likes.likedBy",
                ],
              }
            : false,
        // Fixed: Check if current user's ID exists in the saves array
        isSavedByUser:
          req.user && req.user._id
            ? {
                $in: [
                  new mongoose.Types.ObjectId(req.user._id),
                  "$saves.savedBy",
                ],
              }
            : false,
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $skip: limitNum * (pageNum - 1),
    },
    {
      $limit: limitNum,
    },
  ]);

  const totalPages = Math.ceil(totalImages / limitNum);
  const hasNextPage = pageNum < totalPages;
  const hasPreviousPage = pageNum > 1;

  return res.status(200).json(
    new apiResponse(
      200,
      {
        images,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalImages,
          hasNextPage,
          hasPreviousPage,
          limit: limitNum,
        },
      },
      "User gallery fetched successfully"
    )
  );
});

const getSavedImageOfUser=asyncHandler(async(req,res)=>{
 
  const saves=await Save.find({savedBy:req.user._id}).sort({createdAt:-1});
  const savedImages=[];
  saves.map(save=>{
    savedImages.push(save.image);
  });
    
  return res.status(200).json(new apiResponse(200,savedImages,"Saved images fetched successfully"));
  
})
const getGallery = asyncHandler(async (req, res) => {
  const { limit = 10, page = 1 } = req.query;
  const limitNum = parseInt(limit, 10)||10;
  const pageNum = parseInt(page, 10)||1;

  console.log("Fetching page:", pageNum, "with limit:", limitNum);

  const totalImages = await Image.countDocuments({ uploaded: true });

  const images = await Image.aggregate([
    {
      $match: { uploaded: true },
    },
    {
      $lookup: {
        from: "users",
        localField: "uploader",
        foreignField: "_id",
        as: "uploader",
        pipeline: [
          {
            $project: {
              username: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "likes", // Simplified lookup without nested pipeline
        localField: "_id",
        foreignField: "image",
        as: "likes",
      },
    },
    {
      $lookup: {
        from: "saves", // Simplified lookup without nested pipeline
        localField: "_id",
        foreignField: "image",
        as: "saves",
      },
    },
    {
      $lookup: {
        from: "downloads",
        localField: "_id",
        foreignField: "image",
        as: "downloads",
      },
    },
    {
      $addFields: {
        uploader: { $first: "$uploader" },
        likesCount: { $size: "$likes" },
        savesCount: { $size: "$saves" },
        downloadsCount: { $size: "$downloads" },
        // Fixed: Correct field reference for checking user interactions
        isLikedByUser:
          req.user && req.user._id
            ? {
                $in: [
                  new mongoose.Types.ObjectId(req.user._id),
                  "$likes.likedBy",
                ],
              }
            : false,
        isSavedByUser:
          req.user && req.user._id
            ? {
                $in: [
                  new mongoose.Types.ObjectId(req.user._id),
                  "$saves.savedBy",
                ],
              }
            : false,
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $skip: limitNum * (pageNum - 1),
    },
    {
      $limit: limitNum,
    },
  ]);

  const totalPages = Math.ceil(totalImages / limitNum);
  const hasNextPage = pageNum < totalPages;
  const hasPreviousPage = pageNum > 1;

  return res.status(200).json(
    new apiResponse(
      200,
      {
        images,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalImages,
          hasNextPage,
          hasPreviousPage,
          limit: limitNum,
        },
      },
      "Gallery fetched successfully"
    )
  );
});

const getTotalImagesCount = asyncHandler(async (req, res) => {
  const count = await Image.countDocuments();
  return res
    .status(200)
    .json(
      new apiResponse(200, count, "Total images count fetched successfully")
    );
});
const getUserImageCount = asyncHandler(async (req, res) => {
  const { userId } = req.query;
  const count = await Image.countDocuments({ uploader: userId });
  return res
    .status(200)
    .json(
      new apiResponse(200, count, "Total images count fetched successfully")
    );
});
const searchImages = asyncHandler(async (req, res) => {
  const { query, limit = 10, threshold = 0.76, page = 1 } = req.query;
  const userId = req.user?._id;
  const limitNum = parseInt(limit, 10);
  const pageNum = parseInt(page, 10);

  if (!query || query.trim().length === 0) {
    throw new apiError(400, "Search query is required");
  }

  // Get total count for pagination (approximate)
  const totalSearchResults = await searchSimilarImages(query.trim(), {
    limit: 1000, // Get a large number to count total
    threshold: parseFloat(threshold),
    userId: null,
  });

  const totalResults = totalSearchResults.results.length;
  const skip = limitNum * (pageNum - 1);

  // Get paginated results
  const results = await searchSimilarImages(query.trim(), {
    limit: limitNum + skip, // Get enough results to skip
    threshold: parseFloat(threshold),
    userId,
  });
  const paginatedResults = {
    ...results,
    results: results.results.slice(skip, skip + limitNum),
  };

  const totalPages = Math.ceil(totalResults / limitNum);
  const hasNextPage = pageNum < totalPages;
  const hasPreviousPage = pageNum > 1;

  return res.status(200).json(
    new apiResponse(
      200,
      {
        ...paginatedResults,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalResults,
          hasNextPage,
          hasPreviousPage,
          limit: limitNum,
        },
      },
      "Images searched successfully"
    )
  );
});

const getSimilarImages = asyncHandler(async (req, res) => {
  const { imageId } = req.params;
  const { limit = 10, threshold = 0.8 } = req.query;
  const userId = req.user?._id;

  if (!imageId) {
    throw new apiError(400, "Image ID is required");
  }

  const results = await findSimilarImagesById(imageId, {
    limit: parseInt(limit),
    threshold: parseFloat(threshold),
    userId,
  });

  return res
    .status(200)
    .json(new apiResponse(200, results, "Similar images found successfully"));
});
const advancedSearch = asyncHandler(async (req, res) => {
  const {
    query,
    tags,
    uploader,
    dateFrom,
    dateTo,
    limit = 10,
    threshold = 0.7,
    page = 1,
  } = req.query;

  const userId = req.user?._id;
  const limitNum = parseInt(limit, 10);
  const pageNum = parseInt(page, 10);

  if (!query || query.trim().length === 0) {
    throw new apiError(400, "Search query is required");
  }

  const searchParams = {
    query: query.trim(),
    tags: tags ? tags.split(",").map((tag) => tag.trim()) : [],
    uploader: uploader || null,
    dateRange: dateFrom && dateTo ? { from: dateFrom, to: dateTo } : null,
    limit: limitNum * 3, // Get more results for better pagination
    threshold: parseFloat(threshold),
    userId,
  };

  // Get total results for pagination
  const totalSearchResults = await advancedImageSearch({
    ...searchParams,
    limit: 1000, // Large number to get total count
  });

  const totalResults = totalSearchResults.results.length;
  const skip = limitNum * (pageNum - 1);

  // Get actual paginated results
  const results = await advancedImageSearch({
    ...searchParams,
    limit: limitNum + skip,
  });

  // Apply manual pagination
  const paginatedResults = {
    ...results,
    results: results.results.slice(skip, skip + limitNum),
  };

  const totalPages = Math.ceil(totalResults / limitNum);
  const hasNextPage = pageNum < totalPages;
  const hasPreviousPage = pageNum > 1;

  return res.status(200).json(
    new apiResponse(
      200,
      {
        ...paginatedResults,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalResults,
          hasNextPage,
          hasPreviousPage,
          limit: limitNum,
        },
      },
      "Advanced search completed successfully"
    )
  );
});

const discoverImages = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  const userId = req.user?._id;

  const results = await getRandomImages(parseInt(limit), userId);

  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        { images: results },
        "Random images retrieved successfully"
      )
    );
});

export {
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
  getUserImageCount,
  getImagesHistoryOfUser,
  getSavedImageOfUser,
};
