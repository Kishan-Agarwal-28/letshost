// imageDB.ts
import { openDB } from "idb";
import type { HistoryItem } from "@/pages/imageTransformerspage/ai-image";

let imageDB: any;

// Initialize the database in an IIFE
(async () => {
  imageDB = await openDB("image-store", 1, {
    upgrade(db) {
      db.createObjectStore("images", { keyPath: "id" });
    },
  });
})();

// Helper function to ensure DB is ready
async function ensureDBReady() {
  while (!imageDB) {
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  return imageDB;
}

export async function saveImageWithMeta(item: HistoryItem, base64: string, userId: string) {
  const db = await ensureDBReady();
  await db.put("images", {
    ...item,
    id: `${userId}_${item.id}`, // Add user prefix to ID
    base64, // the actual image data
  });
}

export async function loadImage(id: string, userId: string): Promise<string | null> {
  const db = await ensureDBReady();
  const record = await db.get("images", `${userId}_${id}`);
  return record?.base64 ?? null;
}

// Helper function to get all keys for a specific user
export async function getUserImageKeys(userId: string): Promise<IDBValidKey[]> {
  const db = await ensureDBReady();
  const allKeys = await db.getAllKeys("images");
  return allKeys.filter((key:IDBValidKey)=> String(key).startsWith(`${userId}_`));
}

// Helper function to get user-specific record
export async function getUserImageRecord(key: IDBValidKey, userId: string) {
  const db = await ensureDBReady();
  const keyStr = String(key);
  if (keyStr.startsWith(`${userId}_`)) {
    return await db.get("images", key);
  }
  return null;
}

// Helper function to delete user-specific record
export async function deleteUserImageRecord(key: IDBValidKey, userId: string) {
  const db = await ensureDBReady();
  const keyStr = String(key);
  if (keyStr.startsWith(`${userId}_`)) {
    await db.delete("images", key);
    return true;
  }
  return false;
}

// Helper function to update user-specific record
export async function updateUserImageRecord(key: IDBValidKey, userId: string, updates: Partial<HistoryItem & { base64: string }>) {
  const db = await ensureDBReady();
  const keyStr = String(key);
  if (keyStr.startsWith(`${userId}_`)) {
    const record = await db.get("images", key);
    if (record) {
      await db.put("images", { ...record, ...updates });
      return true;
    }
  }
  return false;
}

// Helper function to clear all user data
export async function clearUserData(userId: string) {
  const db = await ensureDBReady();
  const userKeys = await getUserImageKeys(userId);
  for (const key of userKeys) {
    await db.delete("images", key);
  }
}

// Helper function to get user data count
export async function getUserImageCount(userId: string): Promise<number> {
  const userKeys = await getUserImageKeys(userId);
  return userKeys.length;
}

// Export the imageDB for direct access if needed (will be undefined initially)
export { imageDB };