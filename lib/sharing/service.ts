import { and, eq } from "drizzle-orm";
import { db } from "../../db";
import { projects, sharePermissions } from "../../db/schema";
import { type SharingInput } from "./schema";

function mapPermission(permission: typeof sharePermissions.$inferSelect) {
  return { userId: permission.userId ?? "", permission: permission.permission };
}

export async function getProjectSharing(projectId: string) {
  const project = await db.select({ id: projects.id, visibility: projects.visibility }).from(projects).where(eq(projects.id, projectId)).get();
  if (!project) return null;
  const permissions = (await db.select().from(sharePermissions).where(and(eq(sharePermissions.resourceType, "project"), eq(sharePermissions.resourceId, projectId))).all() as Array<typeof sharePermissions.$inferSelect>).filter((permission) => permission.userId).map(mapPermission);
  return { resourceType: "project" as const, resourceId: project.id, visibility: project.visibility, permissions };
}

export async function updateProjectSharing(projectId: string, input: SharingInput) {
  const current = await db.select({ id: projects.id }).from(projects).where(eq(projects.id, projectId)).get();
  if (!current) return null;
  await db.update(projects).set({ visibility: input.visibility }).where(eq(projects.id, projectId)).run();
  await db.delete(sharePermissions).where(and(eq(sharePermissions.resourceType, "project"), eq(sharePermissions.resourceId, projectId))).run();
  if (input.permissions.length > 0) await db.insert(sharePermissions).values(input.permissions.map((permission) => ({ id: `permission-${crypto.randomUUID()}`, resourceType: "project" as const, resourceId: projectId, userId: permission.userId, permission: permission.permission, createdAt: new Date() }))).run();
  return getProjectSharing(projectId);
}
