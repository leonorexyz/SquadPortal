import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { googleProjectSources } from "@/db/schema";
import { getProject } from "@/lib/projects/service";
import type { GoogleProjectSourceInput } from "./sources-schema";

function mapSource(source: typeof googleProjectSources.$inferSelect) {
  return {
    id: source.id,
    projectId: source.projectId,
    userId: source.userId,
    documentId: source.documentId,
    documentName: source.documentName,
    documentType: source.documentType,
    range: source.range,
    syncEnabled: source.syncEnabled,
    lastSyncedAt: source.lastSyncedAt?.toISOString() ?? null,
    createdAt: source.createdAt.toISOString(),
    updatedAt: source.updatedAt.toISOString(),
  };
}

async function authorizeProjectSource(projectId: string, userId: string) {
  const project = await getProject(projectId);
  if (!project) return { status: "missing" as const };
  if (project.ownerId !== userId) return { status: "forbidden" as const };
  return { status: "ok" as const };
}

export async function listGoogleProjectSources(projectId: string, userId: string) {
  const authorization = await authorizeProjectSource(projectId, userId);
  if (authorization.status !== "ok") return authorization;
  const data = await db.select().from(googleProjectSources).where(eq(googleProjectSources.projectId, projectId)).all();
  return { status: "ok" as const, data: data.map(mapSource) };
}

export async function saveGoogleProjectSource(projectId: string, userId: string, input: GoogleProjectSourceInput) {
  const authorization = await authorizeProjectSource(projectId, userId);
  if (authorization.status !== "ok") return authorization;
  const existing = await db.select().from(googleProjectSources)
    .where(and(eq(googleProjectSources.projectId, projectId), eq(googleProjectSources.documentId, input.documentId)))
    .get();
  const now = new Date();

  if (existing) {
    await db.update(googleProjectSources).set({
      userId,
      documentName: input.documentName,
      documentType: input.documentType,
      range: input.range,
      syncEnabled: input.syncEnabled,
      updatedAt: now,
    }).where(eq(googleProjectSources.id, existing.id)).run();
    const updated = await db.select().from(googleProjectSources).where(eq(googleProjectSources.id, existing.id)).get();
    return updated ? { status: "ok" as const, data: mapSource(updated) } : { status: "missing" as const };
  }

  const created = {
    id: `google-source-${crypto.randomUUID()}`,
    projectId,
    userId,
    documentId: input.documentId,
    documentName: input.documentName,
    documentType: input.documentType,
    range: input.range,
    syncEnabled: input.syncEnabled,
    lastSyncedAt: null,
    createdAt: now,
    updatedAt: now,
  };
  await db.insert(googleProjectSources).values(created).run();
  return { status: "ok" as const, data: mapSource(created) };
}

export async function deleteGoogleProjectSource(projectId: string, userId: string, documentId: string) {
  const authorization = await authorizeProjectSource(projectId, userId);
  if (authorization.status !== "ok") return authorization;
  const deleted = await db.delete(googleProjectSources).where(and(eq(googleProjectSources.projectId, projectId), eq(googleProjectSources.documentId, documentId))).run();
  return { status: (deleted.rowsAffected ?? deleted.changes ?? 0) > 0 ? "deleted" as const : "not-found" as const };
}
