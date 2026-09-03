import { and, count, eq, gte, inArray, lte, ne, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "../../../../db";
import { projects, sessions, tasks, users } from "../../../../db/schema";
import { dashboardSummaryResponseSchema } from "../../../../lib/dashboard/schema";
import type { ProjectStatus } from "../../../../lib/projects/schema";

export const dynamic = "force-dynamic";

function countValue(result: { count: number } | undefined) {
  return Number(result?.count ?? 0);
}

export async function GET() {
  try {
    const activeProjects = countValue(await db.select({ count: count() }).from(projects).where(inArray(projects.status, ["preparation", "development", "sit", "uat", "go-live", "implementation"])).get());
    const totalProjects = countValue(await db.select({ count: count() }).from(projects).get());
    const completedTasks = countValue(await db.select({ count: count() }).from(tasks).where(eq(tasks.status, "done")).get());
    const pendingTasks = countValue(await db.select({ count: count() }).from(tasks).where(ne(tasks.status, "done")).get());
    const dueThisWeek = countValue(await db.select({ count: count() }).from(tasks).where(and(
      ne(tasks.status, "done"),
      gte(tasks.dueDate, sql`date('now')`),
      lte(tasks.dueDate, sql`date('now', '+7 days')`),
    )).get());
    const activeMembers = countValue(await db.select({ count: count() }).from(users).where(eq(users.status, "active")).get());
    const onlineMembers = countValue(await db.select({ count: count() }).from(sessions).where(gte(sessions.expiresAt, new Date())).get());
    const projectStatuses = await db.select({ status: projects.status, count: count() }).from(projects).groupBy(projects.status).all();
    const taskStatuses = await db.select({ status: tasks.status, count: count() }).from(tasks).groupBy(tasks.status).all();

    return NextResponse.json(dashboardSummaryResponseSchema.parse({
      projects: {
        active: activeProjects,
        total: totalProjects,
      byStatus: Object.fromEntries(projectStatuses.map((row: { status: ProjectStatus; count: number }) => [row.status, Number(row.count)])),
      },
      tasks: {
        completed: completedTasks,
        pending: pendingTasks,
        dueThisWeek,
        total: completedTasks + pendingTasks,
      byStatus: Object.fromEntries(taskStatuses.map((row: { status: "todo" | "inprogress" | "done"; count: number }) => [row.status, Number(row.count)])),
      },
      members: {
        active: activeMembers,
        online: onlineMembers,
      },
      generatedAt: new Date().toISOString(),
    }));
  } catch (error) {
    console.error("Failed to load dashboard summary", error);
    return NextResponse.json({ error: "Unable to load dashboard summary" }, { status: 500 });
  }
}
