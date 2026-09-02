import { desc, eq, sql } from "drizzle-orm";
import { db } from "../../db";
import { stories, tasks, users } from "../../db/schema";

const chartColors = ["#7357f6", "#61c9a0", "#f6b84e", "#e98282", "#5595ef", "#d47bf5"];

export async function getProductivityAggregate() {
  const members = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(eq(users.status, "active"))
    .orderBy(desc(users.createdAt))
    .all() as Array<{ id: string; name: string }>;

  const storyCounts = await db
    .select({ userId: stories.userId, count: sql<number>`count(*)` })
    .from(stories)
    .groupBy(stories.userId)
    .all() as Array<{ userId: string; count: number }>;

  const completedTaskCounts = await db
    .select({ userId: tasks.assigneeId, count: sql<number>`count(*)` })
    .from(tasks)
    .where(eq(tasks.status, "done"))
    .groupBy(tasks.assigneeId)
    .all() as Array<{ userId: string | null; count: number }>;

  const storyCountByUser = new Map(storyCounts.map((row) => [row.userId, Number(row.count)]));
  const completedTaskCountByUser = new Map(completedTaskCounts.map((row) => [row.userId, Number(row.count)]));
  const scores = members.map((member) => (storyCountByUser.get(member.id) ?? 0) + (completedTaskCountByUser.get(member.id) ?? 0));
  const totalActivity = scores.reduce((total, score) => total + score, 0);
  const rawPercentages = scores.map((score) => totalActivity === 0 ? 0 : (score / totalActivity) * 100);
  const roundedPercentages = rawPercentages.map((value) => Math.round(value));

  if (totalActivity > 0 && roundedPercentages.length > 0) {
    const roundedTotal = roundedPercentages.reduce((total, value) => total + value, 0);
    roundedPercentages[roundedPercentages.length - 1] += 100 - roundedTotal;
  }

  return {
    data: members.map((member, index) => ({
      id: member.id,
      name: member.name,
      value: roundedPercentages[index] ?? 0,
      storyCount: storyCountByUser.get(member.id) ?? 0,
      completedTaskCount: completedTaskCountByUser.get(member.id) ?? 0,
      color: chartColors[index % chartColors.length],
    })),
    meta: {
      totalActivity,
      basis: "stories + completed tasks" as const,
      generatedAt: new Date().toISOString(),
    },
  };
}
