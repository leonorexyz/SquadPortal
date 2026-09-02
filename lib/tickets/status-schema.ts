import { z } from "zod";
import { ticketResponseSchema, ticketStatusSchema } from "./schema";

export const ticketStatusUpdateSchema = z.object({
  status: ticketStatusSchema,
}).strict();

export const ticketStatusResponseSchema = ticketResponseSchema;
