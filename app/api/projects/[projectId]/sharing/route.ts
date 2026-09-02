import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { getProjectSharing, updateProjectSharing } from "../../../../../lib/sharing/service";
import { sharingInputSchema, sharingResponseSchema } from "../../../../../lib/sharing/schema";

export const dynamic = "force-dynamic";

type SharingRouteContext = { params: Promise<{ projectId: string }> };

export async function GET(_request: NextRequest, context: SharingRouteContext) {
  const { projectId } = await context.params;
  const sharing = await getProjectSharing(projectId);
  return sharing ? NextResponse.json(sharingResponseSchema.parse(sharing)) : NextResponse.json({ error: "Project not found" }, { status: 404 });
}

export async function PUT(request: NextRequest, context: SharingRouteContext) {
  try {
    const { projectId } = await context.params;
    const input = sharingInputSchema.parse(await request.json());
    const sharing = await updateProjectSharing(projectId, input);
    return sharing ? NextResponse.json(sharingResponseSchema.parse(sharing)) : NextResponse.json({ error: "Project not found" }, { status: 404 });
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: "Invalid sharing payload", details: error.flatten() }, { status: 400 });
    console.error("Failed to update project sharing", error);
    return NextResponse.json({ error: "Unable to update project sharing" }, { status: 500 });
  }
}
