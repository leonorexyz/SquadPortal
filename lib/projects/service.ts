import { and, desc, eq, like, or } from "drizzle-orm";
import { db } from "../../db";
import { projects, users } from "../../db/schema";
import { type ProjectInput, type ProjectUpdate } from "./schema";

export const DEFAULT_PROJECT_OWNER_ID = "demo-user";

async function ensureDemoOwner(ownerId = DEFAULT_PROJECT_OWNER_ID) {
  await db.insert(users).values({ id: ownerId, email: ownerId === DEFAULT_PROJECT_OWNER_ID ? "sarah@squad.local" : `${ownerId}@squad.local`, name: ownerId === DEFAULT_PROJECT_OWNER_ID ? "Sarah Anderson" : ownerId, role: "admin", status: "active" }).onConflictDoNothing().run();
}

function mapProject(project: typeof projects.$inferSelect) {
  return { id: project.id, name: project.name, description: project.description, status: project.status, visibility: project.visibility, dueDate: project.dueDate, ownerId: project.ownerId, createdAt: project.createdAt.toISOString() };
}

export async function listProjects(options: { ownerId?: string; search?: string; status?: "ongoing" | "completed" | "onhold"; visibility?: "internal" | "public" } = {}) {
  if (options.ownerId) await ensureDemoOwner(options.ownerId);
  const filters = [];
  if (options.ownerId) filters.push(eq(projects.ownerId, options.ownerId));
  if (options.search) {
    const pattern = `%${options.search}%`;
    filters.push(or(like(projects.name, pattern), like(projects.description, pattern)));
  }
  if (options.status) filters.push(eq(projects.status, options.status));
  if (options.visibility) filters.push(eq(projects.visibility, options.visibility));
  const query = db.select().from(projects);
  const rows = filters.length > 0 ? await query.where(and(...filters)).orderBy(desc(projects.createdAt)).all() : await query.orderBy(desc(projects.createdAt)).all();
  return rows.map(mapProject);
}

export async function getProject(projectId: string) {
  const project = await db.select().from(projects).where(eq(projects.id, projectId)).get();
  return project ? mapProject(project) : null;
}

export async function createProject(input: ProjectInput) {
  const ownerId = input.ownerId ?? DEFAULT_PROJECT_OWNER_ID;
  await ensureDemoOwner(ownerId);
  const project = { id: `project-${crypto.randomUUID()}`, name: input.name, description: input.description, status: input.status, visibility: input.visibility, dueDate: input.dueDate ?? null, ownerId, createdAt: new Date() };
  await db.insert(projects).values(project).run();
  return mapProject(project);
}

export async function updateProject(projectId: string, input: ProjectUpdate) {
  const current = await db.select().from(projects).where(eq(projects.id, projectId)).get();
  if (!current) return null;
  await db.update(projects).set(input).where(eq(projects.id, projectId)).run();
  return mapProject({ ...current, ...input });
}

export async function deleteProject(projectId: string) {
  const result = await db.delete(projects).where(eq(projects.id, projectId)).run();
  return (result.rowsAffected ?? result.changes ?? 0) > 0;
}
