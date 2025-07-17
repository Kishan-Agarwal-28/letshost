import { generateEmbedding } from "../controllers/ai.controller.js";
import { quad } from "../db/connectVectorDB.js";
import { VECTOR_SIZE, COLLECTION_NAME } from "../db/connectVectorDB.js";
import { Image } from "../models/gallery.model.js";
import mongoose from "mongoose";

const createSearchableText = (title, description, prompt, tags) => {
  const tagString = Array.isArray(tags) ? tags.join(" ") : "";
  return `${title} ${description} ${prompt} ${tagString}`.trim();
};

const uploadToVectorDB = async (imageData) => {
  try {
    const { mongoId, title, description, prompt, tags } = imageData;

    if (!mongoId) {
      throw new Error("MongoDB document ID is required");
    }

    // Create searchable text from metadata
    const searchableText = createSearchableText(
      title,
      description,
      prompt,
      tags
    );

    // Generate embedding
    const embedding = await generateEmbedding(searchableText);

    // Store only essential data in Qdrant
    const point = {
      id: mongoId.toString(), // Use MongoDB _id as Qdrant point ID
      vector: embedding,
      payload: {
        mongoId: mongoId.toString(), // Reference to MongoDB document
        createdAt: new Date().toISOString(),
      },
    };
    await quad.upsert(COLLECTION_NAME, {
      wait: true,
      points: [point],
    });

    console.log(`Successfully uploaded image ${mongoId} to vector database`);
    return { success: true, pointId: point.id };
  } catch (error) {
    console.error("Error uploading to vector database:", error);
    throw error;
  }
};

export const fetchImageDetails = async (imageIds, userId = null) => {
  try {
    const images = await Image.aggregate([
      {
        $match: { _id: { $in: imageIds } }
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
          from: "likes",
          localField: "_id",
          foreignField: "image",
          as: "likes",
        },
      },
      {
        $lookup: {
          from: "saves",
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
          // Check if current user has liked/saved this image
          isLiked: userId
            ? {
                $in: [
                  new mongoose.Types.ObjectId(userId),
                  "$likes.likedBy",
                ],
              }
            : false,
          isSaved: userId
            ? {
                $in: [
                  new mongoose.Types.ObjectId(userId),
                  "$saves.savedBy",
                ],
              }
            : false,
        },
      },
      {
        $project: {
          title: 1,
          description: 1,
          prompt: 1,
          imageUrl: 1,
          public_id: 1,
          tags: 1,
          uploader: 1,
          likesCount: 1,
          savesCount: 1,
          downloadsCount: 1,
          isLiked: 1,
          isSaved: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ]);

    return images;
  } catch (error) {
    console.error("Error fetching image details from MongoDB:", error);
    throw error;
  }
};

export const searchSimilarImages = async (query, options = {}) => {
  try {
    const {
      limit = 10,
      threshold = 0.7,
      userId = null,
      offset = 0,
    } = options;

    // Generate embedding for search query
    const queryEmbedding = await generateEmbedding(query);

    // Search in Qdrant with higher limit for pagination
    const searchResults = await quad.search(COLLECTION_NAME, {
      vector: queryEmbedding,
      limit: Math.max(limit, 100),
      score_threshold: threshold,
      with_payload: true,
      with_vector: false,
      offset: offset || 0,
    });

    if (searchResults.length === 0) {
      return {
        query,
        results: [],
        totalFound: 0,
      };
    }

    // Extract MongoDB IDs and scores
    const imageIds = searchResults.map((result) => new mongoose.Types.ObjectId(result.payload.mongoId));
    const scoreMap = new Map(
      searchResults.map((result) => [result.payload.mongoId, result.score])
    );

    // Fetch complete image details from MongoDB
    const imageDetails = await fetchImageDetails(imageIds, userId);

    // Combine with similarity scores and maintain order
    const results = imageDetails
      .map((image) => ({
        ...image,
        similarityScore: scoreMap.get(image._id.toString()),
      }))
      .sort((a, b) => b.similarityScore - a.similarityScore);

    return {
      query,
      results,
      totalFound: results.length,
    };
  } catch (error) {
    console.error("Error searching similar images:", error);
    throw error;
  }
};

/**
 * Find similar images to a specific image by its MongoDB ID
 */
export const findSimilarImagesById = async (mongoId, options = {}) => {
  try {
    const { limit = 10, threshold = 0.8, userId = null } = options;

    // Get the target image's vector from Qdrant
    const targetImage = await quad.retrieve(COLLECTION_NAME, {
      ids: [mongoId.toString()],
      with_vector: true,
      with_payload: true,
    });

    if (!targetImage || targetImage.length === 0) {
      throw new Error(`Image with ID ${mongoId} not found in vector database`);
    }

    const targetVector = targetImage[0].vector;

    // Search for similar images
    const searchResults = await quad.search(COLLECTION_NAME, {
      vector: targetVector,
      limit: limit + 1, // +1 to exclude target image
      score_threshold: threshold,
      with_payload: true,
      with_vector: false,
    });

    // Filter out the target image and get MongoDB IDs
    const similarImageIds = searchResults
      .filter((result) => result.payload.mongoId !== mongoId.toString())
      .slice(0, limit)
      .map((result) => new mongoose.Types.ObjectId(result.payload.mongoId));

    const scoreMap = new Map(
      searchResults.map((result) => [result.payload.mongoId, result.score])
    );

    // Fetch target image details
    const targetImageDetails = await fetchImageDetails([new mongoose.Types.ObjectId(mongoId)], userId);

    // Fetch similar images details
    const similarImagesDetails = await fetchImageDetails(
      similarImageIds,
      userId
    );

    // Add similarity scores
    const similarImagesWithScores = similarImagesDetails
      .map((image) => ({
        ...image,
        similarityScore: scoreMap.get(image._id.toString()),
      }))
      .sort((a, b) => b.similarityScore - a.similarityScore);

    return {
      targetImage: targetImageDetails[0],
      similarImages: similarImagesWithScores,
      totalFound: similarImagesWithScores.length,
    };
  } catch (error) {
    console.error("Error finding similar images by ID:", error);
    throw error;
  }
};

/**
 * Advanced search with MongoDB filters
 */
export const advancedImageSearch = async (searchParams) => {
  try {
    const {
      query,
      tags = [],
      uploader = null,
      dateRange = null,
      limit = 10,
      threshold = 0.7,
      userId = null,
    } = searchParams;

    // First, get candidate images from vector search with higher limit
    const vectorResults = await searchSimilarImages(query, {
      limit: Math.max(limit * 5, 100),
      threshold,
      userId: null,
    });

    if (vectorResults.results.length === 0) {
      return vectorResults;
    }

    // Build MongoDB filter for additional constraints
    const mongoFilter = {
      _id: { $in: vectorResults.results.map((r) => r._id) },
    };

    // Add additional filters
    if (tags.length > 0) {
      mongoFilter.tags = { $in: tags };
    }

    if (uploader) {
      mongoFilter.uploader = uploader;
    }

    if (dateRange && dateRange.from && dateRange.to) {
      mongoFilter.createdAt = {
        $gte: new Date(dateRange.from),
        $lte: new Date(dateRange.to),
      };
    }

    // Apply filters and get results using aggregation pipeline
    const filteredImages = await Image.aggregate([
      {
        $match: mongoFilter
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
          from: "likes",
          localField: "_id",
          foreignField: "image",
          as: "likes",
        },
      },
      {
        $lookup: {
          from: "saves",
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
          isLiked: userId
            ? {
                $in: [
                  new mongoose.Types.ObjectId(userId),
                  "$likes.likedBy",
                ],
              }
            : false,
          isSaved: userId
            ? {
                $in: [
                  new mongoose.Types.ObjectId(userId),
                  "$saves.savedBy",
                ],
              }
            : false,
        },
      },
    ]);

    // Create score map from vector results
    const scoreMap = new Map(
      vectorResults.results.map((r) => [r._id.toString(), r.similarityScore])
    );

    // Add similarity scores
    const results = filteredImages.map((image) => ({
      ...image,
      similarityScore: scoreMap.get(image._id.toString()),
    }));

    // Sort by similarity score
    results.sort((a, b) => b.similarityScore - a.similarityScore);

    return {
      query,
      results,
      totalFound: results.length,
    };
  } catch (error) {
    console.error("Error in advanced image search:", error);
    throw error;
  }
};

export const getRandomImages = async (limit = 10, userId = null) => {
  try {
    // Get random images from MongoDB using aggregation pipeline
    const randomImages = await Image.aggregate([
      { $sample: { size: limit } },
      {
        $lookup: {
          from: "users",
          localField: "uploader",
          foreignField: "_id",
          as: "uploader",
          pipeline: [{ $project: { username: 1, avatar: 1 } }],
        },
      },
      {
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "image",
          as: "likes",
        },
      },
      {
        $lookup: {
          from: "saves",
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
          isLiked: userId
            ? {
                $in: [
                  new mongoose.Types.ObjectId(userId),
                  "$likes.likedBy",
                ],
              }
            : false,
          isSaved: userId
            ? {
                $in: [
                  new mongoose.Types.ObjectId(userId),
                  "$saves.savedBy",
                ],
              }
            : false,
        },
      },
    ]);

    return randomImages;
  } catch (error) {
    console.error("Error getting random images:", error);
    throw error;
  }
};

/**
 * Delete image from vector database
 */
export const deleteFromVectorDB = async (mongoId) => {
  try {
    await quad.delete(COLLECTION_NAME, {
      wait: true,
      points: [mongoId.toString()],
    });
    console.log(`Successfully deleted image ${mongoId} from vector database`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting from vector database:", error);
    throw error;
  }
};

/**
 * Update image embedding in vector database
 */
export const updateVectorDB = async (mongoId, updatedData) => {
  try {
    const { title, description, prompt, tags } = updatedData;

    // Create new searchable text
    const searchableText = createSearchableText(
      title,
      description,
      prompt,
      tags
    );

    // Generate new embedding
    const embedding = await generateEmbedding(searchableText);

    // Update the point with minimal payload
    await quad.upsert(COLLECTION_NAME, {
      wait: true,
      points: [
        {
          id: mongoId.toString(),
          vector: embedding,
          payload: {
            mongoId: mongoId.toString(),
            updatedAt: new Date().toISOString(),
          },
        },
      ],
    });

    console.log(`Successfully updated image ${mongoId} in vector database`);
    return { success: true };
  } catch (error) {
    console.error("Error updating vector database:", error);
    throw error;
  }
};

export { uploadToVectorDB };