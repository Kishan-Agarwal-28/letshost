// imageDB.ts
import { openDB } from "idb";
import type { HistoryItem } from "@/pages/imageTransformerspage/ai-image";

export const imageDB = await openDB("image-store", 1, {
  upgrade(db) {
    db.createObjectStore("images", { keyPath: "id" });
  },
});

export async function saveImageWithMeta(item: HistoryItem, base64: string, userId: string) {
  await imageDB.put("images", {
    ...item,
    id: `${userId}_${item.id}`, // Add user prefix to ID
    base64, // the actual image data
  });
}

export async function loadImage(id: string, userId: string): Promise<string | null> {
  const record = await imageDB.get("images", `${userId}_${id}`);
  return record?.base64 ?? null;
}

// Helper function to get all keys for a specific user
export async function getUserImageKeys(userId: string): Promise<IDBValidKey[]> {
  const allKeys = await imageDB.getAllKeys("images");
  return allKeys.filter(key => String(key).startsWith(`${userId}_`));
}

// Helper function to get user-specific record
export async function getUserImageRecord(key: IDBValidKey, userId: string) {
  const keyStr = String(key);
  if (keyStr.startsWith(`${userId}_`)) {
    return await imageDB.get("images", key);
  }
  return null;
}

// Helper function to delete user-specific record
export async function deleteUserImageRecord(key: IDBValidKey, userId: string) {
  const keyStr = String(key);
  if (keyStr.startsWith(`${userId}_`)) {
    await imageDB.delete("images", key);
    return true;
  }
  return false;
}

// Helper function to update user-specific record
export async function updateUserImageRecord(key: IDBValidKey, userId: string, updates: Partial<HistoryItem & { base64: string }>) {
  const keyStr = String(key);
  if (keyStr.startsWith(`${userId}_`)) {
    const record = await imageDB.get("images", key);
    if (record) {
      await imageDB.put("images", { ...record, ...updates });
      return true;
    }
  }
  return false;
}

// Helper function to clear all user data
export async function clearUserData(userId: string) {
  const userKeys = await getUserImageKeys(userId);
  for (const key of userKeys) {
    await imageDB.delete("images", key);
  }
}

// Helper function to get user data count
export async function getUserImageCount(userId: string): Promise<number> {
  const userKeys = await getUserImageKeys(userId);
  return userKeys.length;
}