import path from "path";
import fs from "fs/promises";
import { statSync, rmSync } from "fs";
import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import mime from "mime-types";
import pLimit from "p-limit";
import { createClient } from "@supabase/supabase-js";

const s3Client = new S3Client({
  forcePathStyle: true,
  region: process.env.AWS_REGION,
  endpoint: process.env.AWS_ENDPOINT,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_ACCESS_KEY_SECRET,
  },
});
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_TOKEN
);

// Recursively gather all file paths relative to base folder
async function walk(dir, base) {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return await walk(fullPath, base);
      } else {
        return [path.relative(base, fullPath)];
      }
    })
  );

  return files.flat();
}

async function uploadToS3(userID, PROJECT_ID) {
  const distFolderPath = path.join(
    process.cwd(),
    "public",
    "temp",
    userID.toString()
  );
  const limit = pLimit(10);

  console.log("Starting upload...");
  console.log("distFolderPath:", distFolderPath);

  const relativeFiles = await walk(distFolderPath, distFolderPath);

  const uploadPromises = relativeFiles.map((relativePath) =>
    limit(async () => {
      const fullPath = path.join(distFolderPath, relativePath);
      if (statSync(fullPath).isDirectory()) return;

      const contentType = mime.lookup(fullPath) || undefined;

      const command = new PutObjectCommand({
        Bucket: "subdomains",
        Key: `__outputs/${userID}/${PROJECT_ID}/${relativePath.replace(/\\/g, "/")}`,
        Body: await fs.readFile(fullPath),
        ContentType: contentType,
      });

      await s3Client.send(command);
      console.log("Uploaded:", relativePath);
    })
  );

  await Promise.all(uploadPromises);

  // Clean up temporary folder
  rmSync(distFolderPath, { recursive: true, force: true });
  console.log("Done. Upload completed and temp folder cleaned.");
}

async function listObjects(dir) {
  const command = new ListObjectsV2Command({
    Bucket: "subdomains",
    Prefix: `__outputs/${dir}/`,
    MaxKeys: 1000,
  });
  const data = await s3Client.send(command);
  console.log("data", data);
  const contents = data.Contents;
  console.log("contents", contents);
  const files = [];
  for (const content of contents) {
    files.push(content.Key);
  }
  return files;
}
async function deleteObjects(dir) {
  const keys = await listObjects(dir);
  if (keys.length === 0) {
    console.log("Nothing to delete.");
    return null;
  }

  const command = new DeleteObjectsCommand({
    Bucket: "subdomains",
    Delete: {
      Objects: keys.map((Key) => ({ Key })),
    },
  });

  const result = await s3Client.send(command);
  return result;
}

async function upload(userID, PROJECT_ID) {
  try {
    const { data, error } = await supabase.storage
      .from("subdomains")
      .createSignedUploadUrl("__outputs", `${userID}/${PROJECT_ID}`);

    return data.signedUrl;
  } catch (error) {
    console.error("Error uploading to S3:", error);
    throw new Error("Failed to upload to S3");
  }
}

export { uploadToS3, deleteObjects, listObjects, upload };
