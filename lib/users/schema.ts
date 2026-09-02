import { z } from "zod";

export const userRoleSchema = z.enum(["admin", "editor", "viewer"]);
export const userStatusSchema = z.enum(["active", "inactive"]);

export const userInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255),
  role: userRoleSchema.default("viewer"),
  status: userStatusSchema.default("active"),
  emailVerified: z.boolean().optional().default(false),
  image: z.string().trim().url().optional().nullable(),
  avatarUrl: z.string().trim().url().optional().nullable(),
});

export const userUpdateSchema = userInputSchema.partial();

export const userInviteSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255),
  role: userRoleSchema.default("viewer"),
});

export const userListQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  role: userRoleSchema.optional(),
  status: userStatusSchema.optional(),
});

export const userResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: userRoleSchema,
  status: userStatusSchema,
  emailVerified: z.boolean(),
  image: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const userListResponseSchema = z.object({
  data: z.array(userResponseSchema),
  meta: z.object({ count: z.number().int().nonnegative() }),
});

export type UserInput = z.infer<typeof userInputSchema>;
export type UserUpdate = z.infer<typeof userUpdateSchema>;
export type UserInvite = z.infer<typeof userInviteSchema>;
