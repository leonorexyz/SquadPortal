import { z } from "zod";

export const sharingPermissionSchema = z.object({
  userId: z.string().min(1),
  permission: z.enum(["read", "write"]),
});

export const sharingInputSchema = z.object({
  visibility: z.enum(["internal", "public"]),
  permissions: z.array(sharingPermissionSchema).max(100).default([]),
});

export const sharingResponseSchema = z.object({
  resourceType: z.literal("project"),
  resourceId: z.string().min(1),
  visibility: z.enum(["internal", "public"]),
  permissions: z.array(sharingPermissionSchema),
});

export const knowledgeSharingResponseSchema = sharingResponseSchema.extend({
  resourceType: z.literal("knowledge"),
});

export type SharingInput = z.infer<typeof sharingInputSchema>;
