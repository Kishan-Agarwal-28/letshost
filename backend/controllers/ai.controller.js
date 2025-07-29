import asyncHandler from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import {
  GoogleGenAI,
  HarmCategory,
  HarmBlockThreshold,
  Modality,
} from "@google/genai";
import { User } from "../models/user.model.js";
import { Image } from "../models/gallery.model.js";
import { uploadImageToGallery } from "../services/cloudinary.service.js";
import { Queue } from "bullmq";
const vectorQueue = new Queue("vector-queue", {
  connection: {
    host: process.env.REDIS_URI,
    port: process.env.REDIS_PORT,
    username: process.env.REDIS_UNAME,
    password: process.env.REDIS_PASSWORD,
  },
});

const DEFAULT_CONFIG = {
  temperature: 0.7,
  topP: 0.9,
  topK: 40,
  maxOutputTokens: 2048,
  candidateCount: 1,
};

const SAFETY_PRESETS = {
  STRICT: [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
    },
  ],
  MODERATE: [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
  ],
  PERMISSIVE: [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
  ],
};

const enhancePrompt = (userPrompt, options = {}) => {
  const qualityEnhancements = [
    "ultra-high resolution",
    "professional photography quality",
    "sharp focus and clarity",
    "rich color depth",
    "perfect lighting and shadows",
  ];

  const styleModifiers = options.style ? [`in ${options.style} style`] : [];
  const resolutionHint = options.resolution || "1024x1024 resolution";
  const aspectRatio = options.aspectRatio
    ? `aspect ratio ${options.aspectRatio}`
    : "";

  return `
${userPrompt}

Technical specifications: ${qualityEnhancements.join(", ")}, ${resolutionHint}
${styleModifiers.length > 0 ? styleModifiers.join(", ") : ""}
${aspectRatio}

Ensure: photorealistic details, perfect anatomy if humans/animals present, professional composition, zero visual artifacts, exceptional image quality worthy of professional portfolio.


Ensure: photorealistic details, perfect anatomy if humans/animals present, professional composition, zero visual artifacts, exceptional image quality worthy of professional portfolio.

===== CRITICAL REQUIREMENT =====
YOU MUST END YOUR RESPONSE WITH THIS EXACT JSON FORMAT:


{
  "title": "A short creative title for this image",
  "description": "A brief, engaging description of the image content and style",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}


- Title: Must be creative and descriptive (5-10 words)
- Description: Must be engaging and detailed (20-50 words)
- Tags: Must include exactly 5 relevant tags covering content, style, mood, and technical aspects

FAILURE TO INCLUDE THIS JSON WILL RESULT IN AN INCOMPLETE RESPONSE.


  `.trim();
};

const generateImage = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new apiError(400, "User ID is required");
  }

  if (!req.body.prompt) {
    throw new apiError(400, "Prompt is required");
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new apiError(404, "User not found");
  }

  if (user.genCredits <= 0) {
    throw new apiError(400, "No credits available");
  }

  const ai = new GoogleGenAI({
    apiKey: req.body.apiKey || process.env.GEMINI_API_KEY,
  });

  try {
    const enhancedPrompt = enhancePrompt(req.body.prompt, req.body.options);

    const image = await ai.models.generateContent({
      model: "gemini-2.0-flash-preview-image-generation",
      contents: enhancedPrompt,
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
        temperature: DEFAULT_CONFIG.temperature,
        topP: DEFAULT_CONFIG.topP,
        topK: DEFAULT_CONFIG.topK,
        maxOutputTokens: DEFAULT_CONFIG.maxOutputTokens,
        candidateCount: DEFAULT_CONFIG.candidateCount,
        safetySettings: SAFETY_PRESETS.STRICT,
      },
    });

    // More flexible content checking
    if (!image.candidates || image.candidates.length === 0) {
      throw new apiError(500, "No candidates returned from API");
    }

    const candidate = image.candidates[0];
    if (
      !candidate.content ||
      !candidate.content.parts ||
      candidate.content.parts.length === 0
    ) {
      throw new apiError(500, "No content parts in response");
    }

    const parts = candidate.content.parts;

    // Based on the structure: parts[0] = text (prompt), parts[1] = image, parts[2] = text (metadata JSON)
    let promptText = req.body.prompt;
    let imageData = null;
    let metadata = {
      title: "Generated Image",
      description:
        req.body.prompt.substring(0, 100) +
        (req.body.prompt.length > 100 ? "..." : ""),
      tags: ["ai-generated", "gemini"],
    };

    // Extract image data from second part
    if (parts[1]) {
      if (parts[1].image) {
        imageData = parts[1].image;
      } else if (parts[1].imageData) {
        imageData = parts[1].imageData;
      } else if (parts[1].inlineData) {
        imageData = parts[1].inlineData.data;
      } else if (parts[1].blob) {
        imageData = parts[1].blob;
      }
    }

    // Extract metadata JSON from third part
    if (parts[2] && parts[2].text) {
      const metadataText = parts[2].text.trim();
      const jsonMatch = metadataText.match(/\{[\s\S]*?\}/);

      if (jsonMatch) {
        try {
          const extractedMetadata = JSON.parse(jsonMatch[0]);
          metadata = {
            title: extractedMetadata.title || metadata.title,
            description: extractedMetadata.description || metadata.description,
            tags: Array.isArray(extractedMetadata.tags)
              ? extractedMetadata.tags
              : metadata.tags,
          };
        } catch (parseError) {
          // Keep default metadata if parsing fails
        }
      }
    }

    if (!imageData) {
      throw new apiError(500, "No image data found in response");
    }

    const cleanPrompt = promptText || req.body.prompt;

    // Upload to Cloudinary
    const uploadResult = await uploadImageToGallery(imageData);

    // Deduct credits after successful generation
    if (!req.body.apiKey) {
      user.genCredits -= 1;
      await user.save();
    }

    // Save to database
    const imageDB = await Image.create({
      title: metadata.title,
      public_id: uploadResult.public_id,
      description: metadata.description,
      prompt: cleanPrompt,
      imageUrl: uploadResult.secure_url,
      uploader: req.user._id,
      tags: metadata.tags,
      likes: [],
      saves: [],
      uploaded: false,
    });
    // adding to queue for search
    await vectorQueue.add("vectorizeImage", {
      mongoId: imageDB._id,
      title: metadata.title,
      description: metadata.description,
      prompt: cleanPrompt,
      tags: metadata.tags,
      connection: {
        host: process.env.REDIS_URI,
        port: process.env.REDIS_PORT,
        username: process.env.REDIS_UNAME,
        password: process.env.REDIS_PASSWORD,
      },
      attempts: 3, // Retry up to 3 times for the job
      backoff: {
        type: "exponential", // Exponential backoff for retries
        delay: 2000, // Initial delay of 2 seconds
      },
      limiter: {
        max: 10, // Max jobs processed per interval
        duration: 1000, // Per 1 second
      },
      removeOnComplete: true, // Remove job when it completes
      removeOnFail: true, // Remove job when it fails
      removeOnSuccess: true, // Remove job when it succeeds
    });

    return res.status(200).json(
      new apiResponse(
        200,
        {
          image: parts,
          credits: user.genCredits,
          public_id: uploadResult.public_id,
        },
        "Image generated successfully"
      )
    );
  } catch (error) {
    // If credits were deducted but operation failed, restore them
    if (!req.body.apiKey && error.statusCode !== 400) {
      try {
        const currentUser = await User.findById(req.user._id);
        currentUser.genCredits += 1;
        await currentUser.save();
      } catch (creditError) {
        // Silent error handling for credit restoration
      }
    }

    throw new apiError(
      error.statusCode || 500,
      `Image generation failed: ${error.message}`
    );
  }
});
// Utility function to introduce a delay

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
    const response = await fetch("https://letshost-embedder.hf.space/passage", {
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

export { generateImage, generateEmbedding };
