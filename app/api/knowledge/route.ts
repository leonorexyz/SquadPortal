import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { DEFAULT_KNOWLEDGE_AUTHOR_ID, createKnowledgeArticle, listVisibleKnowledgeArticles, updateKnowledgeFile } from "@/lib/knowledge/service";
import { knowledgeArticleInputSchema, knowledgeArticleListQuerySchema, knowledgeArticleListResponseSchema, knowledgeArticleResponseSchema } from "@/lib/knowledge/schema";
import { saveKnowledgeFile, KNOWLEDGE_FILE_MAX_BYTES } from "@/lib/knowledge/files";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const queryResult = knowledgeArticleListQuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams.entries()));
  if (!queryResult.success) return NextResponse.json({ error: "Invalid knowledge document filters", details: queryResult.error.flatten() }, { status: 400 });
  const userId = request.headers.get("x-user-id") ?? DEFAULT_KNOWLEDGE_AUTHOR_ID;
  const data = await listVisibleKnowledgeArticles({ ...queryResult.data, userId });
  return NextResponse.json(knowledgeArticleListResponseSchema.parse({ data, meta: { count: data.length } }));
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id") ?? DEFAULT_KNOWLEDGE_AUTHOR_ID;
    let input: unknown;
    let file: File | null = null;
    if (request.headers.get("content-type")?.includes("multipart/form-data")) {
      const form = await request.formData();
      input = {
        title: form.get("title"),
        content: form.get("content") ?? "",
        category: form.get("category") || null,
        visibility: form.get("visibility") ?? "internal",
        authorId: userId,
      };
      const formFile = form.get("file");
      file = formFile instanceof File ? formFile : null;
    } else {
      input = { ...(await request.json() as Record<string, unknown>), authorId: userId };
    }
    if (file && file.size > KNOWLEDGE_FILE_MAX_BYTES) return NextResponse.json({ error: "File exceeds 10 MB limit" }, { status: 413 });
    const article = await createKnowledgeArticle(knowledgeArticleInputSchema.parse(input));
    if (file) {
      await saveKnowledgeFile(article.id, file);
      const updated = await updateKnowledgeFile(article.id, userId, { fileName: file.name, fileUrl: `/api/knowledge/${article.id}/file`, mimeType: file.type || "application/octet-stream", fileSize: file.size });
      if (updated.status !== "ok") throw new Error("FILE_METADATA_UPDATE_FAILED");
      return NextResponse.json(knowledgeArticleResponseSchema.parse(updated.article), { status: 201 });
    }
    return NextResponse.json(knowledgeArticleResponseSchema.parse(article), { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: "Invalid knowledge document payload", details: error.flatten() }, { status: 400 });
    if (error instanceof Error && error.message === "FILE_TOO_LARGE") return NextResponse.json({ error: "File exceeds 10 MB limit" }, { status: 413 });
    console.error("Failed to create knowledge document", error);
    return NextResponse.json({ error: "Unable to create knowledge document" }, { status: 500 });
  }
}
