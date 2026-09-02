import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { DEFAULT_KNOWLEDGE_AUTHOR_ID, canReadKnowledgeArticle, deleteKnowledgeArticle, getKnowledgeArticle, updateKnowledgeArticle, updateKnowledgeFile } from "@/lib/knowledge/service";
import { knowledgeArticleResponseSchema, knowledgeArticleUpdateSchema } from "@/lib/knowledge/schema";
import { KNOWLEDGE_FILE_MAX_BYTES, removeKnowledgeFile, saveKnowledgeFile } from "@/lib/knowledge/files";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ documentId: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const { documentId } = await context.params;
  const userId = request.headers.get("x-user-id") ?? DEFAULT_KNOWLEDGE_AUTHOR_ID;
  const article = await getKnowledgeArticle(documentId);
  if (article && !await canReadKnowledgeArticle(documentId, userId)) return NextResponse.json({ error: "Knowledge document not found" }, { status: 404 });
  return article ? NextResponse.json(knowledgeArticleResponseSchema.parse(article)) : NextResponse.json({ error: "Knowledge document not found" }, { status: 404 });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { documentId } = await context.params;
  const userId = request.headers.get("x-user-id") ?? DEFAULT_KNOWLEDGE_AUTHOR_ID;
  try {
    if (request.headers.get("content-type")?.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file");
      if (!(file instanceof File)) return NextResponse.json({ error: "File is required" }, { status: 400 });
      if (file.size > KNOWLEDGE_FILE_MAX_BYTES) return NextResponse.json({ error: "File exceeds 10 MB limit" }, { status: 413 });
      await saveKnowledgeFile(documentId, file);
      const result = await updateKnowledgeFile(documentId, userId, { fileName: file.name, fileUrl: `/api/knowledge/${documentId}/file`, mimeType: file.type || "application/octet-stream", fileSize: file.size });
      if (result.status === "missing") return NextResponse.json({ error: "Knowledge document not found" }, { status: 404 });
      if (result.status === "forbidden") return NextResponse.json({ error: "You do not have access to update this document" }, { status: 403 });
      return NextResponse.json(knowledgeArticleResponseSchema.parse(result.article));
    }
    const result = await updateKnowledgeArticle(documentId, userId, knowledgeArticleUpdateSchema.parse(await request.json()));
    if (result.status === "missing") return NextResponse.json({ error: "Knowledge document not found" }, { status: 404 });
    if (result.status === "forbidden") return NextResponse.json({ error: "You do not have access to update this document" }, { status: 403 });
    return NextResponse.json(knowledgeArticleResponseSchema.parse(result.article));
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: "Invalid knowledge document payload", details: error.flatten() }, { status: 400 });
    if (error instanceof Error && error.message === "FILE_TOO_LARGE") return NextResponse.json({ error: "File exceeds 10 MB limit" }, { status: 413 });
    console.error("Failed to update knowledge document", error);
    return NextResponse.json({ error: "Unable to update knowledge document" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { documentId } = await context.params;
  const userId = request.headers.get("x-user-id") ?? DEFAULT_KNOWLEDGE_AUTHOR_ID;
  const result = await deleteKnowledgeArticle(documentId, userId);
  if (result.status === "missing") return NextResponse.json({ error: "Knowledge document not found" }, { status: 404 });
  if (result.status === "forbidden") return NextResponse.json({ error: "You do not have access to delete this document" }, { status: 403 });
  await removeKnowledgeFile(documentId);
  return new NextResponse(null, { status: 204 });
}
