import { Worker } from "bullmq";
import { connectRedis } from "./connectRedis.js";
import { uploadToVectorDB } from "./quad.service.js";
import { connectVectorDB, initializeCollection } from "./connectVectorDB.js";
import IORedis from "ioredis";
import { connectDB } from "./connectDB.js";
connectDB();
connectRedis();

const connection = new IORedis({
  host: process.env.REDIS_URI,
  port: process.env.REDIS_PORT,
  username: process.env.REDIS_UNAME,
  password: process.env.REDIS_PASSWORD
}, { 
  maxRetriesPerRequest: null 
});

// Initialize collection on startup
await connectVectorDB();
initializeCollection().catch(console.error);

const vectorWorker = new Worker("vector-queue", async (job) => {
  console.log("Vector worker started for job:", job.id);
  
  try {
    const { mongoId, title, description, prompt, tags } = job.data;
    
    // Validate required data
    if (!mongoId) {
      throw new Error("MongoDB document ID is required");
    }
    
    if (!title || !description || !prompt) {
      throw new Error("Missing required fields: title, description, or prompt");
    }

    // Upload only essential data to vector database
    const result = await uploadToVectorDB({
      mongoId,
      title,
      description,
      prompt,
      tags: tags || []
    });

    console.log("Vector upload successful:", result);
    return result;

  } catch (error) {
    console.error("Vector worker error:", error);
    throw error;
  }
}, { connection });

vectorWorker.on("completed", (job, result) => {
  console.log(`Vector worker completed job ${job.id}:`, result);
});

vectorWorker.on("failed", (job, err) => {
  console.error(`Vector worker failed job ${job.id}:`, err.message);
});

vectorWorker.on("error", (err) => {
  console.error("Vector worker error:", err);
});

