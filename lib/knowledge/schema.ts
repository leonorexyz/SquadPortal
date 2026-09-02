import { z } from "zod";

const visibilitySchema = z.enum(["internal", "public"]);

export const knowledgeArticleListQuerySchema = z.object({
  search: z.string().trim().min(1).max(120).optional(),
  category: z.string().trim().min(1).max(80).optional(),
  visibility: visibilitySchema.optional(),
});

export const knowledgeArticleInputSchema = z.object({
  title: z.string().trim().min(1).max(160),
  content: z.string().max(100_000).default(""),
  category: z.string().trim().max(80).nullable().optional(),
  visibility: visibilitySchema.default("internal"),
  authorId: z.string().trim().min(1).optional(),
});

export const knowledgeArticleUpdateSchema = knowledgeArticleInputSchema.partial().omit({ authorId: true });

export const knowledgeArticleResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  category: z.string().nullable(),
  visibility: visibilitySchema,
  authorId: z.string(),
  fileName: z.string().nullable(),
  fileUrl: z.string().nullable(),
  mimeType: z.string().nullable(),
  fileSize: z.number().int().nonnegative().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const knowledgeArticleListResponseSchema = z.object({
  data: z.array(knowledgeArticleResponseSchema),
  meta: z.object({ count: z.number().int().nonnegative() }),
});

export type KnowledgeArticleInput = z.infer<typeof knowledgeArticleInputSchema>;
export type KnowledgeArticleUpdate = z.infer<typeof knowledgeArticleUpdateSchema>;
