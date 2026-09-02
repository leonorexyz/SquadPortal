import { z } from "zod";

export const googleConnectSchema = z.object({
  callbackURL: z.string().url().optional(),
  accessToken: z.string().min(1).optional(),
  refreshToken: z.string().min(1).optional(),
  tokenExpiry: z.coerce.date().optional(),
  scopes: z.array(z.string().min(1)).optional(),
}).superRefine((input, context) => {
  if (Boolean(input.accessToken) !== Boolean(input.refreshToken)) {
    context.addIssue({ code: "custom", message: "accessToken and refreshToken must be provided together", path: ["accessToken"] });
  }
});

export const googleConnectionResponseSchema = z.object({
  provider: z.literal("google"),
  connected: z.boolean(),
  accountId: z.string().nullable(),
  connectedAt: z.string().datetime().nullable(),
  tokenExpiresAt: z.string().datetime().nullable(),
  scopes: z.array(z.string()),
});

export type GoogleConnectInput = z.infer<typeof googleConnectSchema>;
