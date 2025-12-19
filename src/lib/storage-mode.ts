/**
 * 存储模式配置
 * - local: 仅使用本地 IndexedDB
 * - cloud: 使用 Supabase 认证 + IndexedDB 本地缓存 + 云端同步
 */

export type StorageMode = "local" | "cloud";

const STORAGE_MODE_KEY = "cptracker_storage_mode";

export function getStorageMode(): StorageMode {
  const mode = localStorage.getItem(STORAGE_MODE_KEY);
  return mode === "cloud" ? "cloud" : "local";
}

export function setStorageMode(mode: StorageMode): void {
  localStorage.setItem(STORAGE_MODE_KEY, mode);
}

export function isCloudMode(): boolean {
  return getStorageMode() === "cloud";
}
