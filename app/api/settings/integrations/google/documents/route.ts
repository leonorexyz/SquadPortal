import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { authorizeRequest } from "../../../../../../lib/auth/permissions";
import { googleDocumentListResponseSchema, googleDocumentsQuerySchema } from "../../../../../../lib/google/documents-schema";
import { GoogleDocumentError, listGoogleDocuments } from "../../../../../../lib/google/documents";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authorization = await authorizeRequest(request, ["admin", "editor", "viewer"]);
  if (authorization.status === 401) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (authorization.status === 403) return NextResponse.json({ error: "You do not have access to Google documents" }, { status: 403 });

  try {
    const queryResult = googleDocumentsQuerySchema.safeParse({ type: request.nextUrl.searchParams.get("type") ?? undefined });
    if (!queryResult.success) return NextResponse.json({ error: "Invalid Google document filter", details: queryResult.error.flatten() }, { status: 400 });
    const data = await listGoogleDocuments(authorization.user.id, queryResult.data);
    return NextResponse.json(googleDocumentListResponseSchema.parse({ data, meta: { count: data.length } }));
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: "Invalid Google document response" }, { status: 500 });
    if (error instanceof GoogleDocumentError) return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    console.error("Failed to list Google documents", error);
    return NextResponse.json({ error: "Unable to list Google documents" }, { status: 502 });
  }
}
