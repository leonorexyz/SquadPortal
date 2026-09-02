import { existsSync, mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";

const maxAvatarSize = 5 * 1024 * 1024;
const mimeExtensions: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/gif": "gif", "image/webp": "webp" };

function profileDirectory() {
  const directory = path.join(process.cwd(), "data", "profile");
  mkdirSync(directory, { recursive: true });
  return directory;
}

export async function storeProfileAvatar(userId: string, file: Blob) {
  if (file.size > maxAvatarSize) throw new Error("Profile photo must be smaller than 5 MB");
  const extension = mimeExtensions[file.type];
  if (!extension) throw new Error("Profile photo must be a JPEG, PNG, GIF, or WebP image");
  const directory = profileDirectory();
  for (const existing of readdirSync(directory)) {
    if (existing.startsWith(`${userId}.`)) unlinkSync(path.join(directory, existing));
  }
  writeFileSync(path.join(directory, `${userId}.${extension}`), Buffer.from(await file.arrayBuffer()));
  return `/api/profile/avatar?userId=${encodeURIComponent(userId)}&v=${Date.now()}`;
}

export function readProfileAvatar(userId: string) {
  const directory = profileDirectory();
  for (const [mime, extension] of Object.entries(mimeExtensions)) {
    const filePath = path.join(directory, `${userId}.${extension}`);
    if (existsSync(filePath)) return { data: readFileSync(filePath), mime };
  }
  return null;
}
