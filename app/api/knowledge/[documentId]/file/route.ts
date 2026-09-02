import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_KNOWLEDGE_AUTHOR_ID, canReadKnowledgeArticle, getKnowledgeArticle } from "@/lib/knowledge/service";
import { readKnowledgeFile } from "@/lib/knowledge/files";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ documentId: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const { documentId } = await context.params;
  const article = await getKnowledgeArticle(documentId);
  const userId = request.headers.get("x-user-id") ?? DEFAULT_KNOWLEDGE_AUTHOR_ID;
  if (article && !await canReadKnowledgeArticle(documentId, userId)) return NextResponse.json({ error: "Document file not found" }, { status: 404 });
  if (!article?.fileUrl) return NextResponse.json({ error: "Document file not found" }, { status: 404 });
  try {
    const content = await readKnowledgeFile(documentId);
    return new NextResponse(content, {
      headers: {
        "Content-Type": article.mimeType ?? "application/octet-stream",
        "Content-Disposition": `attachment; filename="${(article.fileName ?? "document").replace(/[\"\r\n]/g, "_")}"`,
        "Content-Length": String(content.byteLength),
      },
    });
  } catch {
    return NextResponse.json({ error: "Document file not found" }, { status: 404 });
  }
}
