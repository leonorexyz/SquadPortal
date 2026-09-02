import { z } from "zod";

export const googleDocumentTypeSchema = z.enum(["all", "sheet", "doc"]);

export const googleDocumentsQuerySchema = z.object({
  type: googleDocumentTypeSchema.default("all"),
});

export const googleDocumentSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["sheet", "doc"]),
  mimeType: z.string(),
  modifiedAt: z.string().datetime().nullable(),
  webUrl: z.string().url().nullable(),
});

export const googleDocumentListResponseSchema = z.object({
  data: z.array(googleDocumentSchema),
  meta: z.object({ count: z.number().int().nonnegative() }),
});

export const googleDocumentImportSchema = z.object({
  documentId: z.string().trim().min(1),
  projectId: z.string().trim().min(1),
  range: z.string().trim().min(1).max(200).default("Tasks!A1:G"),
});

export const googleDocumentImportResponseSchema = z.object({
  data: z.object({
    document: googleDocumentSchema,
    projectId: z.string(),
    range: z.string(),
    imported: z.number().int().nonnegative(),
    rows: z.array(z.array(z.union([z.string(), z.number(), z.boolean(), z.null()]))),
  }),
});

export type GoogleDocumentsQuery = z.infer<typeof googleDocumentsQuerySchema>;
export type GoogleDocumentImport = z.infer<typeof googleDocumentImportSchema>;
