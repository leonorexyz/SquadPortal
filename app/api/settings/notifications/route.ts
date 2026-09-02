import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { authorizeRequest } from "../../../../lib/auth/permissions";
import { getNotificationPreferences, updateNotificationPreferences } from "../../../../lib/notifications/service";
import { notificationPreferencesResponseSchema, notificationPreferencesUpdateSchema } from "../../../../lib/notifications/schema";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authorization = await authorizeRequest(request, ["admin", "editor", "viewer"]);
  if (authorization.status === 401) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  return NextResponse.json(notificationPreferencesResponseSchema.parse(await getNotificationPreferences(authorization.user.id)));
}

export async function PATCH(request: NextRequest) {
  const authorization = await authorizeRequest(request, ["admin", "editor", "viewer"]);
  if (authorization.status === 401) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  try {
    const input = notificationPreferencesUpdateSchema.parse(await request.json());
    return NextResponse.json(notificationPreferencesResponseSchema.parse(await updateNotificationPreferences(authorization.user.id, input)));
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: "Invalid notification preferences", details: error.flatten() }, { status: 400 });
    console.error("Failed to update notification preferences", error);
    return NextResponse.json({ error: "Unable to update notification preferences" }, { status: 500 });
  }
}
