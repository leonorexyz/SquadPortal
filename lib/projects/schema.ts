import { z } from "zod";

export const projectInputSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(500).default(""),
  status: z.enum(["ongoing", "completed", "onhold"]).default("ongoing"),
  visibility: z.enum(["internal", "public"]).default("internal"),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "dueDate must use YYYY-MM-DD").nullable().optional(),
  ownerId: z.string().min(1).optional(),
});

export const projectListQuerySchema = z.object({
  ownerId: z.string().trim().min(1).optional(),
  search: z.string().trim().min(1).max(120).optional(),
  status: z.enum(["ongoing", "completed", "onhold"]).optional(),
  visibility: z.enum(["internal", "public"]).optional(),
});

export const projectUpdateSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  description: z.string().trim().max(500).optional(),
  status: z.enum(["ongoing", "completed", "onhold"]).optional(),
  visibility: z.enum(["internal", "public"]).optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "dueDate must use YYYY-MM-DD").nullable().optional(),
}).refine((value) => Object.keys(value).length > 0, "At least one field is required");

export const projectResponseSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  status: z.enum(["ongoing", "completed", "onhold"]),
  visibility: z.enum(["internal", "public"]),
  dueDate: z.string().nullable(),
  ownerId: z.string().min(1),
  createdAt: z.string().datetime(),
});

export const projectListResponseSchema = z.object({
  data: z.array(projectResponseSchema),
  meta: z.object({ count: z.number().int().nonnegative() }),
});

export type ProjectInput = z.infer<typeof projectInputSchema>;
export type ProjectUpdate = z.infer<typeof projectUpdateSchema>;
