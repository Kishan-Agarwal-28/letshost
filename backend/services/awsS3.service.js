import path from "path";
import fs from "fs/promises";
import { statSync, rmSync, existsSync } from "fs";
import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import mime from "mime-types";
import pLimit from "p-limit";
import { createClient } from "@supabase/supabase-js";
import  {Readable} from 'node:stream';
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
  
  // Handle case where Contents is undefined (no files found)
  if (contents && Array.isArray(contents)) {
    for (const content of contents) {
      files.push(content.Key);
    }
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

async function uploadToCDN(userID,currVersion,previousVersion,cdnID) {
  const distFolderPath = path.join(
    process.cwd(),
    "public",
    "temp",
    userID.toString()
  );
  console.log("distFolderPath:", distFolderPath);
  if(!existsSync(distFolderPath)){
    throw new Error("Directory does not exist");
  }
  
    const files=await fs.readdir(distFolderPath, { withFileTypes: true })
      
     try{
      if (files.length === 0) {
        console.log("No files to upload.");
        throw new Error("No files to upload");
      }
      const fullPath = path.join(distFolderPath, files[0].name);
      const contentType = mime.lookup(fullPath) || undefined;
      const folder=contentType?.toLowerCase()?.includes("javascript") ? "js" : "css";
      const command=new PutObjectCommand(
        {
          Bucket:"cdn",
          Key:`${userID}/${folder}/${cdnID}/${currVersion}/${files[0].name}`,
          Body: await fs.readFile(fullPath),
          ContentType: contentType,
        }
      )
      await s3Client.send(command);
      console.log("Uploaded:", files[0].name);
       rmSync(distFolderPath, { recursive: true, force: true });
  console.log("Done. Upload completed and temp folder cleaned.");
  if(previousVersion!==0){
  await deleteFromCDN(userID,cdnID,previousVersion,folder);
  }
  const uploadRelativePath=`${userID}/${folder}/${cdnID}/${currVersion}/${files[0].name}`
  return uploadRelativePath;
  } catch (error) {
    console.error("Error uploading to CDN:", error);
    throw new Error("Failed to upload to CDN");
    
  }
}
async function deleteFromCDN(userID,cdnID,version,folder) {
  const keys = await listFromCDN(userID,cdnID,folder,version);
  if (keys.length === 0) {
    console.log("Nothing to delete.");
    return null;
  }

  const command = new DeleteObjectsCommand({
    Bucket: "cdn",
    Delete: {
      Objects: keys.map((Key) => ({ Key })),
    },
  });

  const result = await s3Client.send(command);
  return result;
  
}

async function listFromCDN(userID, cdnID, folder, version) {
  const command = new ListObjectsV2Command({
    Bucket: "cdn",
    Prefix: `${userID}/${folder}/${cdnID}/${version}/`,
    MaxKeys: 1000,
  });
  const data = await s3Client.send(command);
  const contents = data.Contents;
  const files = [];
  
  // Handle case where Contents is undefined (no files found)
  if (contents && Array.isArray(contents)) {
    for (const content of contents) {
      files.push(content.Key);
    }
  }
  
  return files;
}

async function uploadToTransformBucket(mediaUrl) {
  try {
    console.log("Starting media upload from URL...");
    console.log("Source URL:", mediaUrl);

    const urlObject = new URL(mediaUrl);
    const cloudinaryPath = urlObject.pathname; 
    

    const s3Key = cloudinaryPath.startsWith('/') ? cloudinaryPath.slice(1) : cloudinaryPath;
    
    console.log("S3 Key:", s3Key);
    
    
    const response = await fetch(mediaUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch media: ${response.status} ${response.statusText}`);
    }

    let contentType = response.headers.get('content-type');
    if (!contentType) {
      const fileExtension = path.extname(s3Key);
      contentType = mime.lookup(fileExtension) || 'application/octet-stream';
    }
    
    const contentLength = response.headers.get('content-length');
    
    console.log("Content Type:", contentType);
    console.log("Content Length:", contentLength);
    

    const nodeStream = Readable.fromWeb(response.body);
    
    // Create upload command
    const command = new PutObjectCommand({
      Bucket: "imgix",
      Key: s3Key,
      Body: nodeStream, 
      ContentType: contentType,
      ContentLength: contentLength ? parseInt(contentLength) : undefined,
    });
    
    await s3Client.send(command);
    
    console.log("Uploaded:", s3Key);
    console.log("Done. Media upload completed.");

    return {
      success: true,
      s3Key: s3Key,
      fileName: s3Key,
      originalUrl: mediaUrl,
      contentType: contentType,
      size: contentLength ? parseInt(contentLength) : null,
    };
    
  } catch (error) {
    console.error("Error uploading media to S3:", error);
    throw error;
  }
}


export { uploadToS3, deleteObjects, listObjects, upload ,uploadToCDN, deleteFromCDN, listFromCDN ,uploadToTransformBucket};
