import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { authorizeRequest } from "../../../../../../lib/auth/permissions";
import { deleteGoogleProjectSource, listGoogleProjectSources, saveGoogleProjectSource } from "../../../../../../lib/google/sources";
import { googleProjectSourceDeleteQuerySchema, googleProjectSourceInputSchema, googleProjectSourceListSchema, googleProjectSourceSchema } from "../../../../../../lib/google/sources-schema";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ projectId: string }> };

async function requireAuthorization(request: NextRequest) {
  const authorization = await authorizeRequest(request, ["admin", "editor", "viewer"]);
  if (authorization.status === 401) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (authorization.status === 403) return NextResponse.json({ error: "You do not have access to project sources" }, { status: 403 });
  return authorization;
}

function projectResultResponse(result: Awaited<ReturnType<typeof listGoogleProjectSources>>) {
  if (result.status === "missing") return NextResponse.json({ error: "Project not found" }, { status: 404 });
  if (result.status === "forbidden") return NextResponse.json({ error: "Only the project owner can manage document sources" }, { status: 403 });
  return null;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const authorization = await requireAuthorization(request);
  if (authorization instanceof NextResponse) return authorization;
  const { projectId } = await context.params;
  const result = await listGoogleProjectSources(projectId, authorization.user.id);
  if (result.status !== "ok") return projectResultResponse(result)!;
  return NextResponse.json(googleProjectSourceListSchema.parse({ data: result.data, meta: { count: result.data.length } }));
}

export async function POST(request: NextRequest, context: RouteContext) {
  const authorization = await requireAuthorization(request);
  if (authorization instanceof NextResponse) return authorization;
  try {
    const { projectId } = await context.params;
    const input = googleProjectSourceInputSchema.parse(await request.json());
    const result = await saveGoogleProjectSource(projectId, authorization.user.id, input);
    if (result.status === "missing") return NextResponse.json({ error: "Project not found" }, { status: 404 });
    if (result.status === "forbidden") return NextResponse.json({ error: "Only the project owner can manage document sources" }, { status: 403 });
    return NextResponse.json(googleProjectSourceSchema.parse(result.data), { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: "Invalid project source payload", details: error.flatten() }, { status: 400 });
    console.error("Failed to save Google project source", error);
    return NextResponse.json({ error: "Unable to save project document source" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const authorization = await requireAuthorization(request);
  if (authorization instanceof NextResponse) return authorization;
  try {
    const { projectId } = await context.params;
    const query = googleProjectSourceDeleteQuerySchema.parse({ documentId: request.nextUrl.searchParams.get("documentId") });
  const result = await deleteGoogleProjectSource(projectId, authorization.user.id, query.documentId);
    if (result.status === "missing") return NextResponse.json({ error: "Project not found" }, { status: 404 });
    if (result.status === "forbidden") return NextResponse.json({ error: "Only the project owner can manage document sources" }, { status: 403 });
    if (result.status === "not-found") return NextResponse.json({ error: "Project document source not found" }, { status: 404 });
    return NextResponse.json({ data: { projectId, documentId: query.documentId, deleted: true } });
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: "documentId query parameter is required" }, { status: 400 });
    console.error("Failed to delete Google project source", error);
    return NextResponse.json({ error: "Unable to delete project document source" }, { status: 500 });
  }
}
