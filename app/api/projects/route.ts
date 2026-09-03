import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { authorizeRequest } from "../../../lib/auth/permissions";
import { createProject, listProjects } from "../../../lib/projects/service";
import { projectInputSchema, projectListQuerySchema, projectListResponseSchema, projectResponseSchema } from "../../../lib/projects/schema";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authorization = await authorizeRequest(request, ["admin", "editor", "viewer"]);
  if (authorization.status === 401) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  try {
    const queryResult = projectListQuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams.entries()));
    if (!queryResult.success) return NextResponse.json({ error: "Invalid project filters", details: queryResult.error.flatten() }, { status: 400 });
    const data = await listProjects(queryResult.data);
    return NextResponse.json(projectListResponseSchema.parse({ data, meta: { count: data.length } }));
  } catch (error) {
    console.error("Failed to list projects", error);
    return NextResponse.json({ error: "Unable to load projects" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authorization = await authorizeRequest(request, ["admin", "editor"]);
  if (authorization.status === 401) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (authorization.status === 403) return NextResponse.json({ error: "Only admins and editors can create projects" }, { status: 403 });
  try {
    const input = projectInputSchema.parse({ ...await request.json(), ownerId: authorization.user.id });
    return NextResponse.json(projectResponseSchema.parse(await createProject(input)), { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: "Invalid project payload", details: error.flatten() }, { status: 400 });
    console.error("Failed to create project", error);
    return NextResponse.json({ error: "Unable to create project" }, { status: 500 });
  }
}
