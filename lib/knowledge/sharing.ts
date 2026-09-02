import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { knowledgeArticles, sharePermissions, users } from "@/db/schema";
import type { SharingInput } from "@/lib/sharing/schema";

function mapPermission(permission: typeof sharePermissions.$inferSelect) {
  return { userId: permission.userId ?? "", permission: permission.permission };
}

export async function getKnowledgeSharing(documentId: string) {
  const article = await db.select({ id: knowledgeArticles.id, visibility: knowledgeArticles.visibility })
    .from(knowledgeArticles)
    .where(eq(knowledgeArticles.id, documentId))
    .get();
  if (!article) return null;
  const permissions = (await db.select().from(sharePermissions)
    .where(and(eq(sharePermissions.resourceType, "knowledge"), eq(sharePermissions.resourceId, documentId)))
    .all() as Array<typeof sharePermissions.$inferSelect>)
    .filter((permission) => permission.userId)
    .map(mapPermission);
  return { resourceType: "knowledge" as const, resourceId: article.id, visibility: article.visibility, permissions };
}

export async function updateKnowledgeSharing(documentId: string, userId: string, input: SharingInput) {
  const article = await db.select({ id: knowledgeArticles.id, authorId: knowledgeArticles.authorId })
    .from(knowledgeArticles)
    .where(eq(knowledgeArticles.id, documentId))
    .get();
  if (!article) return { status: "missing" as const, sharing: null };
  if (article.authorId !== userId) return { status: "forbidden" as const, sharing: null };
  const requestedUserIds = [...new Set(input.permissions.map((permission) => permission.userId))];
  if (requestedUserIds.length > 0) {
    const existingUserIds = new Set(((await db.select({ id: users.id }).from(users).where(inArray(users.id, requestedUserIds)).all()) as Array<{ id: string }>).map((user) => user.id));
    const missingUserIds = requestedUserIds.filter((requestedUserId) => !existingUserIds.has(requestedUserId));
    if (missingUserIds.length > 0) return { status: "invalid-users" as const, sharing: null, missingUserIds };
  }
  await db.update(knowledgeArticles).set({ visibility: input.visibility, updatedAt: new Date() }).where(eq(knowledgeArticles.id, documentId)).run();
  await db.delete(sharePermissions).where(and(eq(sharePermissions.resourceType, "knowledge"), eq(sharePermissions.resourceId, documentId))).run();
  if (input.permissions.length > 0) await db.insert(sharePermissions).values(input.permissions.map((permission) => ({ id: `permission-${crypto.randomUUID()}`, resourceType: "knowledge" as const, resourceId: documentId, userId: permission.userId, permission: permission.permission, createdAt: new Date() })) ).run();
  return { status: "ok" as const, sharing: await getKnowledgeSharing(documentId) };
}
