import { z } from "zod";

export const ticketStatusSchema = z.enum(["open", "inprogress", "closed"]);
export const ticketPrioritySchema = z.enum(["high", "medium", "low"]);

export const ticketInputSchema = z.object({
  title: z.string().trim().min(8).max(180),
  description: z.string().trim().min(1).max(20_000),
  status: ticketStatusSchema.default("open"),
  priority: ticketPrioritySchema.default("medium"),
  category: z.string().trim().min(1).max(80).default("Question"),
  assignedTo: z.string().trim().min(1).nullable().optional(),
  createdBy: z.string().trim().min(1).optional(),
});

export const ticketUpdateSchema = z.object({
  title: z.string().trim().min(8).max(180).optional(),
  description: z.string().trim().min(1).max(20_000).optional(),
  status: ticketStatusSchema.optional(),
  priority: ticketPrioritySchema.optional(),
  category: z.string().trim().min(1).max(80).optional(),
  assignedTo: z.string().trim().min(1).nullable().optional(),
});

export const ticketListQuerySchema = z.object({
  search: z.string().trim().min(1).max(120).optional(),
  status: ticketStatusSchema.optional(),
  priority: ticketPrioritySchema.optional(),
  category: z.string().trim().min(1).max(80).optional(),
});

export const ticketResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  status: ticketStatusSchema,
  priority: ticketPrioritySchema,
  category: z.string(),
  createdBy: z.string(),
  assignedTo: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const ticketListResponseSchema = z.object({
  data: z.array(ticketResponseSchema),
  meta: z.object({ count: z.number().int().nonnegative() }),
});

export type TicketInput = z.infer<typeof ticketInputSchema>;
export type TicketUpdate = z.infer<typeof ticketUpdateSchema>;
