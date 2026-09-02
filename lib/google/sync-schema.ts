import { z } from "zod";

export const googleTaskRowsSchema = z.array(
  z.array(z.union([z.string(), z.number(), z.boolean(), z.null()])),
);

export const googleSyncRequestSchema = z.object({
  action: z.enum(["import", "export", "sync"]),
  spreadsheetId: z.string().trim().min(1).optional(),
  range: z.string().trim().min(1).max(200).default("Tasks!A1:G"),
  rows: googleTaskRowsSchema.optional(),
  dryRun: z.boolean().default(false),
});

export const googleSyncResponseSchema = z.object({
  data: z.object({
    projectId: z.string(),
    provider: z.literal("sheets"),
    action: z.enum(["import", "export", "sync"]),
    spreadsheetId: z.string().nullable(),
    range: z.string(),
    imported: z.number().int().nonnegative(),
    exported: z.number().int().nonnegative(),
    rows: googleTaskRowsSchema,
    dryRun: z.boolean(),
    remote: z.object({
      attempted: z.boolean(),
      completed: z.boolean(),
    }),
  }),
});

export type GoogleSyncRequest = z.infer<typeof googleSyncRequestSchema>;
