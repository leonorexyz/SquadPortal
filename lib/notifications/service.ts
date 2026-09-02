import { eq } from "drizzle-orm";
import { db } from "../../db";
import { notificationPreferences } from "../../db/schema";
import { type NotificationPreferencesUpdate } from "./schema";

function mapPreferences(preferences: typeof notificationPreferences.$inferSelect) {
  return {
    userId: preferences.userId,
    ticketReplies: preferences.ticketReplies,
    projectUpdates: preferences.projectUpdates,
    weeklySummary: preferences.weeklySummary,
    updatedAt: (preferences.updatedAt ?? preferences.createdAt).toISOString(),
  };
}

export async function getNotificationPreferences(userId: string) {
  const existing = await db.select().from(notificationPreferences).where(eq(notificationPreferences.userId, userId)).get();
  if (existing) return mapPreferences(existing);
  const now = new Date();
  const created = { userId, ticketReplies: true, projectUpdates: true, weeklySummary: false, createdAt: now, updatedAt: now };
  await db.insert(notificationPreferences).values(created).run();
  return mapPreferences(created);
}

export async function updateNotificationPreferences(userId: string, input: NotificationPreferencesUpdate) {
  const current = await getNotificationPreferences(userId);
  const updatedAt = new Date();
  const update = { ...input, updatedAt };
  await db.update(notificationPreferences).set(update).where(eq(notificationPreferences.userId, userId)).run();
  return { ...current, ...input, updatedAt: updatedAt.toISOString() };
}
