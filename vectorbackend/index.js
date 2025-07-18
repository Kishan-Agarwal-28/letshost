import { Worker, Queue } from "bullmq";
import { connectRedis } from "./connectRedis.js";
import { uploadToVectorDB } from "./quad.service.js";
import { connectVectorDB, initializeCollection } from "./connectVectorDB.js";
import IORedis from "ioredis";
import { connectDB } from "./connectDB.js";
import express from "express";

// Initialize connections
connectDB();
connectRedis();

const connection = new IORedis(
  {
    host: process.env.REDIS_URI,
    port: process.env.REDIS_PORT,
    username: process.env.REDIS_UNAME,
    password: process.env.REDIS_PASSWORD,
  },
  {
    maxRetriesPerRequest: null,
  }
);

// Initialize collection on startup
await connectVectorDB();
initializeCollection().catch(console.error);

// Create queue instance
const vectorQueue = new Queue("vector-queue", { connection });

// Create worker
const vectorWorker = new Worker(
  "vector-queue",
  async (job) => {
    console.log("Vector worker started for job:", job.id);

    try {
      const { mongoId, title, description, prompt, tags } = job.data;

      // Validate required data
      if (!mongoId) {
        throw new Error("MongoDB document ID is required");
      }

      if (!title || !description || !prompt) {
        throw new Error(
          "Missing required fields: title, description, or prompt"
        );
      }

      // Upload only essential data to vector database
      const result = await uploadToVectorDB({
        mongoId,
        title,
        description,
        prompt,
        tags: tags || [],
      });

      console.log("Vector upload successful:", result);
      return result;
    } catch (error) {
      console.error("Vector worker error:", error);
      throw error;
    }
  },
  { connection }
);

vectorWorker.on("completed", (job, result) => {
  console.log(`Vector worker completed job ${job.id}:`, result);
});

vectorWorker.on("failed", (job, err) => {
  console.error(`Vector worker failed job ${job.id}:`, err.message);
});

vectorWorker.on("error", (err) => {
  console.error("Vector worker error:", err);
});

const app = express();

// Function to trigger the vector worker processing
async function invokeVectorWorker() {
  try {
    // Get queue stats
    const waiting = await vectorQueue.getWaiting();
    const active = await vectorQueue.getActive();
    const completed = await vectorQueue.getCompleted();
    const failed = await vectorQueue.getFailed();

    console.log(`Vector worker invoked - Queue stats:`, {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
    });

    return {
      message: "Vector worker invoked successfully",
      timestamp: new Date().toISOString(),
      queueStats: {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
      },
    };
  } catch (error) {
    console.error("Error invoking vector worker:", error);
    throw error;
  }
}

app.get("/invoke", async (req, res) => {
  try {
    const result = await invokeVectorWorker();
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Invoke route error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Vector worker server running on port ${PORT}`);
  console.log(`Invoke endpoint available at: GET /invoke`);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down gracefully...");
  await vectorWorker.close();
  await vectorQueue.close();
  await connection.quit();
  process.exit(0);
});
