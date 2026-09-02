import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { DEFAULT_KNOWLEDGE_AUTHOR_ID } from "@/lib/knowledge/service";
import { getKnowledgeSharing, updateKnowledgeSharing } from "@/lib/knowledge/sharing";
import { knowledgeSharingResponseSchema, sharingInputSchema } from "@/lib/sharing/schema";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ documentId: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const { documentId } = await context.params;
  const sharing = await getKnowledgeSharing(documentId);
  return sharing ? NextResponse.json(knowledgeSharingResponseSchema.parse(sharing)) : NextResponse.json({ error: "Knowledge document not found" }, { status: 404 });
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { documentId } = await context.params;
    const userId = request.headers.get("x-user-id") ?? DEFAULT_KNOWLEDGE_AUTHOR_ID;
    const result = await updateKnowledgeSharing(documentId, userId, sharingInputSchema.parse(await request.json()));
    if (result.status === "missing") return NextResponse.json({ error: "Knowledge document not found" }, { status: 404 });
    if (result.status === "forbidden") return NextResponse.json({ error: "Only the document owner can change access" }, { status: 403 });
    if (result.status === "invalid-users") return NextResponse.json({ error: "One or more permission users do not exist", userIds: result.missingUserIds }, { status: 400 });
    return NextResponse.json(knowledgeSharingResponseSchema.parse(result.sharing));
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: "Invalid sharing payload", details: error.flatten() }, { status: 400 });
    console.error("Failed to update knowledge sharing", error);
    return NextResponse.json({ error: "Unable to update knowledge sharing" }, { status: 500 });
  }
}
