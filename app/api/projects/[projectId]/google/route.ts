import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { DEFAULT_PROJECT_OWNER_ID } from "../../../../../lib/projects/service";
import { googleSyncRequestSchema, googleSyncResponseSchema } from "../../../../../lib/google/sync-schema";
import { GoogleSyncError, syncProjectWithGoogle } from "../../../../../lib/google/sync";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ projectId: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { projectId } = await context.params;
    const input = googleSyncRequestSchema.parse(await request.json());
    const userId = request.headers.get("x-user-id") ?? DEFAULT_PROJECT_OWNER_ID;
    const result = await syncProjectWithGoogle(projectId, userId, input);
    return NextResponse.json(googleSyncResponseSchema.parse({ data: result }));
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: "Invalid Google sync payload", details: error.flatten() }, { status: 400 });
    if (error instanceof GoogleSyncError) return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    console.error("Failed to sync project with Google Sheets", error);
    return NextResponse.json({ error: "Unable to sync project with Google Sheets" }, { status: 500 });
  }
}
