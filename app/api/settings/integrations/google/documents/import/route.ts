import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { authorizeRequest } from "../../../../../../../lib/auth/permissions";
import { googleDocumentImportResponseSchema, googleDocumentImportSchema } from "../../../../../../../lib/google/documents-schema";
import { GoogleDocumentError, importGoogleDocument } from "../../../../../../../lib/google/documents";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const authorization = await authorizeRequest(request, ["admin", "editor", "viewer"]);
  if (authorization.status === 401) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (authorization.status === 403) return NextResponse.json({ error: "You do not have access to import Google documents" }, { status: 403 });

  try {
    const input = googleDocumentImportSchema.parse(await request.json());
    const result = await importGoogleDocument(authorization.user.id, input);
    return NextResponse.json(googleDocumentImportResponseSchema.parse({ data: result }));
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: "Invalid Google document import payload", details: error.flatten() }, { status: 400 });
    if (error instanceof GoogleDocumentError) return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    console.error("Failed to import Google document", error);
    return NextResponse.json({ error: "Unable to import Google document" }, { status: 502 });
  }
}
