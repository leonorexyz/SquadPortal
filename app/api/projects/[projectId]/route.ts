import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { deleteProject, getProject, updateProject } from "../../../../lib/projects/service";
import { projectResponseSchema, projectUpdateSchema } from "../../../../lib/projects/schema";

export const dynamic = "force-dynamic";

type ProjectRouteContext = { params: Promise<{ projectId: string }> };

export async function GET(_request: NextRequest, context: ProjectRouteContext) {
  const { projectId } = await context.params;
  const project = await getProject(projectId);
  return project ? NextResponse.json(projectResponseSchema.parse(project)) : NextResponse.json({ error: "Project not found" }, { status: 404 });
}

export async function PATCH(request: NextRequest, context: ProjectRouteContext) {
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
  const { projectId } = await context.params;
  return await deleteProject(projectId) ? new NextResponse(null, { status: 204 }) : NextResponse.json({ error: "Project not found" }, { status: 404 });
}
