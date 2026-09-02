import { z } from "zod";

export const storyInputSchema = z.object({
  userId: z.string().min(1).optional(),
  content: z.string().trim().min(10).max(500),
  storyDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "storyDate must use YYYY-MM-DD"),
  visibility: z.enum(["private", "team"]).default("private"),
});

export const storyListQuerySchema = z.object({
  userId: z.string().trim().min(1).optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "from must use YYYY-MM-DD").optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "to must use YYYY-MM-DD").optional(),
}).superRefine((value, context) => {
  if (value.from && value.to && value.from > value.to) context.addIssue({ code: "custom", path: ["to"], message: "to must be on or after from" });
});

export const storyUpdateSchema = z.object({
  content: z.string().trim().min(10).max(500).optional(),
  storyDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "storyDate must use YYYY-MM-DD").optional(),
  visibility: z.enum(["private", "team"]).optional(),
}).refine((value) => Object.keys(value).length > 0, "At least one field is required");

export const storyResponseSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  content: z.string().min(1),
  storyDate: z.string().min(1),
  visibility: z.enum(["private", "team"]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const storyListResponseSchema = z.object({
  data: z.array(storyResponseSchema),
  meta: z.object({ count: z.number().int().nonnegative() }),
});

export type StoryInput = z.infer<typeof storyInputSchema>;
export type StoryUpdate = z.infer<typeof storyUpdateSchema>;
