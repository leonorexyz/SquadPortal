import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { authorizeRequest } from "../../../../lib/auth/permissions";
import { deleteProject, getProject, updateProject } from "../../../../lib/projects/service";
import { projectResponseSchema, projectUpdateSchema } from "../../../../lib/projects/schema";

export const dynamic = "force-dynamic";

type ProjectRouteContext = { params: Promise<{ projectId: string }> };

export async function GET(_request: NextRequest, context: ProjectRouteContext) {
  const authorization = await authorizeRequest(_request, ["admin", "editor", "viewer"]);
  if (authorization.status === 401) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  try {
    const { projectId } = await context.params;
    const project = await getProject(projectId);
    return project ? NextResponse.json(projectResponseSchema.parse(project)) : NextResponse.json({ error: "Project not found" }, { status: 404 });
  } catch (error) {
    console.error("Failed to load project", error);
    return NextResponse.json({ error: "Unable to load project" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: ProjectRouteContext) {
  const authorization = await authorizeRequest(request, ["admin", "editor"]);
  if (authorization.status === 401) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (authorization.status === 403) return NextResponse.json({ error: "Only admins and editors can update projects" }, { status: 403 });
  try {
    const { projectId } = await context.params;
    const input = projectUpdateSchema.parse(await request.json());
    const project = await updateProject(projectId, input);
    return project ? NextResponse.json(projectResponseSchema.parse(project)) : NextResponse.json({ error: "Project not found" }, { status: 404 });
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: "Invalid project payload", details: error.flatten() }, { status: 400 });
    console.error("Failed to update project", error);
    return NextResponse.json({ error: "Unable to update project" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: ProjectRouteContext) {
  const authorization = await authorizeRequest(_request, ["admin", "editor"]);
  if (authorization.status === 401) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (authorization.status === 403) return NextResponse.json({ error: "Only admins and editors can delete projects" }, { status: 403 });
  const { projectId } = await context.params;
  return await deleteProject(projectId) ? new NextResponse(null, { status: 204 }) : NextResponse.json({ error: "Project not found" }, { status: 404 });
}
