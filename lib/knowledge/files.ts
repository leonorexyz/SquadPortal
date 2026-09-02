import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

export const KNOWLEDGE_FILE_MAX_BYTES = 10 * 1024 * 1024;
const knowledgeUploadDirectory = path.resolve(process.cwd(), "data", "knowledge");

export async function saveKnowledgeFile(articleId: string, file: File) {
  if (file.size > KNOWLEDGE_FILE_MAX_BYTES) throw new Error("FILE_TOO_LARGE");
  await mkdir(knowledgeUploadDirectory, { recursive: true });
  await writeFile(path.join(knowledgeUploadDirectory, articleId), Buffer.from(await file.arrayBuffer()));
}

export async function readKnowledgeFile(articleId: string) {
  return readFile(path.join(knowledgeUploadDirectory, articleId));
}

export async function removeKnowledgeFile(articleId: string) {
  await unlink(path.join(knowledgeUploadDirectory, articleId)).catch(() => undefined);
}
