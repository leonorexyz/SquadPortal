import { and, desc, eq, like, or } from "drizzle-orm";
import { db } from "@/db";
import { knowledgeArticles, sharePermissions, users } from "@/db/schema";
import type { KnowledgeArticleInput, KnowledgeArticleUpdate } from "./schema";

export const DEFAULT_KNOWLEDGE_AUTHOR_ID = "demo-user";

async function ensureAuthor(authorId: string) {
  await db.insert(users).values({
    id: authorId,
    email: authorId === DEFAULT_KNOWLEDGE_AUTHOR_ID ? "sarah@squad.local" : `${authorId}@squad.local`,
    name: authorId === DEFAULT_KNOWLEDGE_AUTHOR_ID ? "Sarah Anderson" : authorId,
    role: "admin",
    status: "active",
  }).onConflictDoNothing().run();
}

function mapArticle(article: typeof knowledgeArticles.$inferSelect) {
  return {
    id: article.id,
    title: article.title,
    content: article.content,
    category: article.category,
    visibility: article.visibility,
    authorId: article.authorId,
    fileName: article.fileName,
    fileUrl: article.fileUrl,
    mimeType: article.mimeType,
    fileSize: article.fileSize,
    createdAt: article.createdAt.toISOString(),
    updatedAt: article.updatedAt.toISOString(),
  };
}

export async function listKnowledgeArticles(options: { search?: string; category?: string; visibility?: "internal" | "public" } = {}) {
  const filters = [];
  if (options.search) {
    const pattern = `%${options.search}%`;
    filters.push(or(like(knowledgeArticles.title, pattern), like(knowledgeArticles.content, pattern), like(knowledgeArticles.category, pattern)));
  }
  if (options.category) filters.push(eq(knowledgeArticles.category, options.category));
  if (options.visibility) filters.push(eq(knowledgeArticles.visibility, options.visibility));
  const query = db.select().from(knowledgeArticles);
  const rows = filters.length > 0
    ? await query.where(and(...filters)).orderBy(desc(knowledgeArticles.updatedAt)).all()
    : await query.orderBy(desc(knowledgeArticles.updatedAt)).all();
  return rows.map(mapArticle);
}

export async function getKnowledgeArticle(articleId: string) {
  const article = await db.select().from(knowledgeArticles).where(eq(knowledgeArticles.id, articleId)).get();
  return article ? mapArticle(article) : null;
}

export async function canReadKnowledgeArticle(articleId: string, userId: string) {
  const article = await db.select({ authorId: knowledgeArticles.authorId, visibility: knowledgeArticles.visibility })
    .from(knowledgeArticles)
    .where(eq(knowledgeArticles.id, articleId))
    .get();
  if (!article) return false;
  if (article.authorId === userId || article.visibility === "public") return true;
  return Boolean(await db.select({ id: sharePermissions.id })
    .from(sharePermissions)
    .where(and(eq(sharePermissions.resourceType, "knowledge"), eq(sharePermissions.resourceId, articleId), eq(sharePermissions.userId, userId)))
    .get());
}

export async function canWriteKnowledgeArticle(articleId: string, userId: string) {
  const article = await db.select({ authorId: knowledgeArticles.authorId }).from(knowledgeArticles).where(eq(knowledgeArticles.id, articleId)).get();
  if (!article) return false;
  if (article.authorId === userId) return true;
  return Boolean(await db.select({ id: sharePermissions.id })
    .from(sharePermissions)
    .where(and(eq(sharePermissions.resourceType, "knowledge"), eq(sharePermissions.resourceId, articleId), eq(sharePermissions.userId, userId), eq(sharePermissions.permission, "write")))
    .get());
}

export async function createKnowledgeArticle(input: KnowledgeArticleInput) {
  const authorId = input.authorId ?? DEFAULT_KNOWLEDGE_AUTHOR_ID;
  await ensureAuthor(authorId);
  const now = new Date();
  const article = {
    id: `knowledge-${crypto.randomUUID()}`,
    title: input.title,
    content: input.content,
    category: input.category ?? null,
    visibility: input.visibility,
    authorId,
    fileName: null,
    fileUrl: null,
    mimeType: null,
    fileSize: null,
    createdAt: now,
    updatedAt: now,
  };
  await db.insert(knowledgeArticles).values(article).run();
  return mapArticle(article);
}

export async function updateKnowledgeArticle(articleId: string, userId: string, input: KnowledgeArticleUpdate) {
  const current = await db.select().from(knowledgeArticles).where(eq(knowledgeArticles.id, articleId)).get();
  if (!current) return { status: "missing" as const, article: null };
  if (!await canWriteKnowledgeArticle(articleId, userId)) return { status: "forbidden" as const, article: null };
  const updatedAt = new Date();
  await db.update(knowledgeArticles).set({ ...input, updatedAt }).where(eq(knowledgeArticles.id, articleId)).run();
  return { status: "ok" as const, article: mapArticle({ ...current, ...input, updatedAt }) };
}

export async function updateKnowledgeFile(articleId: string, userId: string, file: { fileName: string; fileUrl: string; mimeType: string; fileSize: number }) {
  const current = await db.select().from(knowledgeArticles).where(eq(knowledgeArticles.id, articleId)).get();
  if (!current) return { status: "missing" as const, article: null };
  if (!await canWriteKnowledgeArticle(articleId, userId)) return { status: "forbidden" as const, article: null };
  const updatedAt = new Date();
  await db.update(knowledgeArticles).set({ ...file, updatedAt }).where(eq(knowledgeArticles.id, articleId)).run();
  return { status: "ok" as const, article: mapArticle({ ...current, ...file, updatedAt }) };
}

export async function deleteKnowledgeArticle(articleId: string, userId: string) {
  const current = await db.select().from(knowledgeArticles).where(eq(knowledgeArticles.id, articleId)).get();
  if (!current) return { status: "missing" as const, article: null };
  if (current.authorId !== userId) return { status: "forbidden" as const, article: null };
  await db.delete(knowledgeArticles).where(eq(knowledgeArticles.id, articleId)).run();
  return { status: "ok" as const, article: mapArticle(current) };
}

export async function listVisibleKnowledgeArticles(options: { userId: string; search?: string; category?: string; visibility?: "internal" | "public" }) {
  const articles = await listKnowledgeArticles(options) as Array<ReturnType<typeof mapArticle>>;
  const readable = await Promise.all(articles.map(async (article) => article.visibility === "public" || await canReadKnowledgeArticle(article.id, options.userId)));
  return articles.filter((_, index) => readable[index]);
}
