import { z } from "zod";

export const taskInputSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).optional(),
  status: z.enum(["todo", "inprogress", "done"]).default("todo"),
  assigneeId: z.string().min(1).nullable().optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "dueDate must use YYYY-MM-DD").nullable().optional(),
  googleDocId: z.string().min(1).nullable().optional(),
});

export const taskListQuerySchema = z.object({
  projectId: z.string().trim().min(1).optional(),
  status: z.enum(["todo", "inprogress", "done"]).optional(),
  search: z.string().trim().min(1).max(120).optional(),
  assigneeId: z.string().trim().min(1).optional(),
  dueFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "dueFrom must use YYYY-MM-DD").optional(),
  dueTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "dueTo must use YYYY-MM-DD").optional(),
});

export const taskUpdateSchema = z.object({
  title: z.string().trim().min(2).max(120).optional(),
  description: z.string().trim().max(500).nullable().optional(),
  status: z.enum(["todo", "inprogress", "done"]).optional(),
  assigneeId: z.string().min(1).nullable().optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "dueDate must use YYYY-MM-DD").nullable().optional(),
  googleDocId: z.string().min(1).nullable().optional(),
}).refine((value) => Object.keys(value).length > 0, "At least one field is required");

export const taskResponseSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
  status: z.enum(["todo", "inprogress", "done"]),
  assigneeId: z.string().nullable(),
  dueDate: z.string().nullable(),
  googleDocId: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const taskListResponseSchema = z.object({
  data: z.array(taskResponseSchema),
  meta: z.object({ count: z.number().int().nonnegative() }),
});

export type TaskInput = z.infer<typeof taskInputSchema>;
export type TaskUpdate = z.infer<typeof taskUpdateSchema>;
