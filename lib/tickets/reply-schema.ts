import { z } from "zod";

export const ticketReplyInputSchema = z.object({
  content: z.string().trim().min(1).max(20_000),
  userId: z.string().trim().min(1).optional(),
});

export const ticketReplyResponseSchema = z.object({
  id: z.string(),
  ticketId: z.string(),
  userId: z.string(),
  content: z.string(),
  createdAt: z.string(),
});

export const ticketReplyListResponseSchema = z.object({
  data: z.array(ticketReplyResponseSchema),
  meta: z.object({ count: z.number().int().nonnegative() }),
});

export type TicketReplyInput = z.infer<typeof ticketReplyInputSchema>;
