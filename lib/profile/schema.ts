import { z } from "zod";

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
});

export type ProfileUpdate = z.infer<typeof profileUpdateSchema>;
