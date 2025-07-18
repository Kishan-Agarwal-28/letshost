import { GoogleGenAI } from "@google/genai";
import { VECTOR_SIZE, COLLECTION_NAME, quad } from "./connectVectorDB.js";
import { Image } from "./connectDB.js";
import { v5 as uuidv5 } from "uuid";
export const createSearchableText = (title, description, prompt, tags) => {
  const tagString = Array.isArray(tags) ? tags.join(" ") : "";
  return `${title} ${description} ${prompt} ${tagString}`.trim();
};
const generateEmbedding = async (text) => {
  //   try {
  //     const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  //     const result = await ai.models.embedContent({
  //       model: "gemini-embedding-exp-03-07",
  //       contents: text,
  //       config: {
  //         taskType: "SEMANTIC_SIMILARITY"
  //       }
  //     });
  //     return result.embeddings[0].values;
  //   } catch (error) {
  //     console.error("Error generating embedding:", error);
  //     throw error;
  //   }
  try {
    const response = await fetch(`${process.env.EMBED_URI}/passage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
      }),
    });
    const data = await response.json();
    return data.embedding;
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw error;
  }
};

export const uploadToVectorDB = async (imageData) => {
  try {
    const { mongoId, title, description, prompt, tags } = imageData;
    console.log(mongoId);
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
    const pointId = uuidv5(mongoId.toString(), uuidv5.URL);
    const point = {
      id: pointId, // Use MongoDB _id as Qdrant point ID
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
    const query = { _id: { $in: imageIds } };

    // Basic projection - adjust fields as needed
    const projection = {
      title: 1,
      description: 1,
      prompt: 1,
      imageUrl: 1,
      public_id: 1,
      tags: 1,
      uploader: 1,
      likes: 1,
      saves: 1,
      createdAt: 1,
      updatedAt: 1,
    };

    const images = await Image.find(query, projection)
      .populate("uploader", "username avatar") // Populate uploader details
      .lean();

    // If userId provided, add user-specific data (liked/saved status)
    if (userId) {
      return images.map((image) => ({
        ...image,
        isLiked: image.likes.includes(userId),
        isSaved: image.saves.includes(userId),
        likesCount: image.likes.length,
        savesCount: image.saves.length,
      }));
    }

    return images.map((image) => ({
      ...image,
      likesCount: image.likes.length,
      savesCount: image.saves.length,
    }));
  } catch (error) {
    console.error("Error fetching image details from MongoDB:", error);
    throw error;
  }
};
export const searchSimilarImages = async (query, options = {}) => {
  try {
    const { limit = 10, threshold = 0.7, userId = null } = options;

    // Generate embedding for search query
    const queryEmbedding = await generateEmbedding(query);

    // Search in Qdrant (returns only MongoDB IDs)
    const searchResults = await quad.search(COLLECTION_NAME, {
      vector: queryEmbedding,
      limit,
      score_threshold: threshold,
      with_payload: true,
      with_vector: false,
    });

    if (searchResults.length === 0) {
      return {
        query,
        results: [],
        totalFound: 0,
      };
    }

    // Extract MongoDB IDs and scores
    const imageIds = searchResults.map((result) => result.payload.mongoId);
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
      .map((result) => result.payload.mongoId);

    const scoreMap = new Map(
      searchResults.map((result) => [result.payload.mongoId, result.score])
    );

    // Fetch target image details
    const [targetImageDetails] = await fetchImageDetails([mongoId], userId);

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
      targetImage: targetImageDetails,
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

    // First, get candidate images from vector search
    const vectorResults = await searchSimilarImages(query, {
      limit: limit * 3, // Get more candidates for filtering
      threshold,
      userId: null, // Don't fetch user-specific data yet
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

    // Apply filters and get final results
    const filteredImages = await Image.find(mongoFilter)
      .populate("uploader", "username avatar")
      .limit(limit)
      .lean();

    // Create score map from vector results
    const scoreMap = new Map(
      vectorResults.results.map((r) => [r._id.toString(), r.similarityScore])
    );

    // Add similarity scores and user-specific data
    let results = filteredImages.map((image) => ({
      ...image,
      similarityScore: scoreMap.get(image._id.toString()),
      likesCount: image.likes.length,
      savesCount: image.saves.length,
    }));

    // Add user-specific data if userId provided
    if (userId) {
      results = results.map((image) => ({
        ...image,
        isLiked: image.likes.includes(userId),
        isSaved: image.saves.includes(userId),
      }));
    }

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
    // Get random images from MongoDB directly (more efficient than vector search)
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
      { $unwind: "$uploader" },
    ]);

    // Add user-specific data if userId provided
    let results = randomImages.map((image) => ({
      ...image,
      likesCount: image.likes.length,
      savesCount: image.saves.length,
    }));

    if (userId) {
      results = results.map((image) => ({
        ...image,
        isLiked: image.likes.includes(userId),
        isSaved: image.saves.includes(userId),
      }));
    }

    return results;
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
