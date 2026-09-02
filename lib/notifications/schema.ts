import { z } from "zod";

export const notificationPreferencesUpdateSchema = z.object({
  ticketReplies: z.boolean().optional(),
  projectUpdates: z.boolean().optional(),
  weeklySummary: z.boolean().optional(),
});

export const notificationPreferencesResponseSchema = z.object({
  userId: z.string(),
  ticketReplies: z.boolean(),
  projectUpdates: z.boolean(),
  weeklySummary: z.boolean(),
  updatedAt: z.string().datetime(),
});

export type NotificationPreferencesUpdate = z.infer<typeof notificationPreferencesUpdateSchema>;
