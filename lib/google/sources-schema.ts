import { z } from "zod";

export const googleProjectSourceInputSchema = z.object({
  documentId: z.string().trim().min(1).max(255),
  documentName: z.string().trim().min(1).max(255),
  documentType: z.enum(["sheet", "doc"]),
  range: z.string().trim().min(1).max(200).default("Tasks!A1:G"),
  syncEnabled: z.boolean().default(true),
});

export const googleProjectSourceSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  userId: z.string(),
  documentId: z.string(),
  documentName: z.string(),
  documentType: z.enum(["sheet", "doc"]),
  range: z.string(),
  syncEnabled: z.boolean(),
  lastSyncedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const googleProjectSourceListSchema = z.object({
  data: z.array(googleProjectSourceSchema),
  meta: z.object({ count: z.number().int().nonnegative() }),
});

export const googleProjectSourceDeleteQuerySchema = z.object({
  documentId: z.string().trim().min(1),
});

export type GoogleProjectSourceInput = z.infer<typeof googleProjectSourceInputSchema>;
