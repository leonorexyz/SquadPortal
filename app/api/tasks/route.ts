import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { createTask, listTasks } from "../../../lib/tasks/service";
import { taskInputSchema, taskListQuerySchema, taskListResponseSchema, taskResponseSchema } from "../../../lib/tasks/schema";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const queryResult = taskListQuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams.entries()));
  if (!queryResult.success) return NextResponse.json({ error: "Invalid task filters", details: queryResult.error.flatten() }, { status: 400 });
  const data = await listTasks(queryResult.data);
  return NextResponse.json(taskListResponseSchema.parse({ data, meta: { count: data.length } }));
}

export async function POST(request: NextRequest) {
  try {
    const input = taskInputSchema.parse(await request.json());
    const task = await createTask(input);
    return task ? NextResponse.json(taskResponseSchema.parse(task), { status: 201 }) : NextResponse.json({ error: "Project not found" }, { status: 404 });
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: "Invalid task payload", details: error.flatten() }, { status: 400 });
    console.error("Failed to create task", error);
    return NextResponse.json({ error: "Unable to create task" }, { status: 500 });
  }
}
