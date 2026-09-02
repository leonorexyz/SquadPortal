import { and, desc, eq, gte, like, lte, or } from "drizzle-orm";
import { db } from "../../db";
import { projects, tasks } from "../../db/schema";
import { type TaskInput, type TaskUpdate } from "./schema";

function mapTask(task: typeof tasks.$inferSelect) {
  return { id: task.id, projectId: task.projectId, title: task.title, description: task.description ?? "", status: task.status, assigneeId: task.assigneeId, dueDate: task.dueDate, googleDocId: task.googleDocId, createdAt: task.createdAt.toISOString(), updatedAt: task.updatedAt.toISOString() };
}

export async function listTasks(options: { projectId?: string; status?: "todo" | "inprogress" | "done"; search?: string; assigneeId?: string; dueFrom?: string; dueTo?: string } = {}) {
  const filters = [];
  if (options.projectId) filters.push(eq(tasks.projectId, options.projectId));
  if (options.status) filters.push(eq(tasks.status, options.status));
  if (options.search) {
    const pattern = `%${options.search}%`;
    filters.push(or(like(tasks.title, pattern), like(tasks.description, pattern)));
  }
  if (options.assigneeId) filters.push(eq(tasks.assigneeId, options.assigneeId));
  if (options.dueFrom) filters.push(gte(tasks.dueDate, options.dueFrom));
  if (options.dueTo) filters.push(lte(tasks.dueDate, options.dueTo));
  const query = db.select().from(tasks);
  const rows = filters.length > 0 ? await query.where(and(...filters)).orderBy(desc(tasks.updatedAt)).all() : await query.orderBy(desc(tasks.updatedAt)).all();
  return rows.map(mapTask);
}

export async function getTask(taskId: string) {
  const task = await db.select().from(tasks).where(eq(tasks.id, taskId)).get();
  return task ? mapTask(task) : null;
}

export async function createTask(input: TaskInput) {
  const project = await db.select({ id: projects.id }).from(projects).where(eq(projects.id, input.projectId)).get();
  if (!project) return null;
  const now = new Date();
  const task = { id: `task-${crypto.randomUUID()}`, projectId: input.projectId, title: input.title, description: input.description ?? null, status: input.status, assigneeId: input.assigneeId ?? null, dueDate: input.dueDate ?? null, googleDocId: input.googleDocId ?? null, createdAt: now, updatedAt: now };
  await db.insert(tasks).values(task).run();
  return mapTask(task);
}

export async function updateTask(taskId: string, input: TaskUpdate) {
  const current = await db.select().from(tasks).where(eq(tasks.id, taskId)).get();
  if (!current) return null;
  const updatedAt = new Date();
  await db.update(tasks).set({ ...input, updatedAt }).where(eq(tasks.id, taskId)).run();
  return mapTask({ ...current, ...input, updatedAt });
}

export async function deleteTask(taskId: string) {
  const result = await db.delete(tasks).where(eq(tasks.id, taskId)).run();
  return (result.rowsAffected ?? result.changes ?? 0) > 0;
}
