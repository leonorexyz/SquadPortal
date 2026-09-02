import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { deleteTask, getTask, updateTask } from "../../../../lib/tasks/service";
import { taskResponseSchema, taskUpdateSchema } from "../../../../lib/tasks/schema";

export const dynamic = "force-dynamic";

type TaskRouteContext = { params: Promise<{ taskId: string }> };

export async function GET(_request: NextRequest, context: TaskRouteContext) {
  const { taskId } = await context.params;
  const task = await getTask(taskId);
  return task ? NextResponse.json(taskResponseSchema.parse(task)) : NextResponse.json({ error: "Task not found" }, { status: 404 });
}

export async function PATCH(request: NextRequest, context: TaskRouteContext) {
  try {
    const { taskId } = await context.params;
    const input = taskUpdateSchema.parse(await request.json());
    const task = await updateTask(taskId, input);
    return task ? NextResponse.json(taskResponseSchema.parse(task)) : NextResponse.json({ error: "Task not found" }, { status: 404 });
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: "Invalid task payload", details: error.flatten() }, { status: 400 });
    console.error("Failed to update task", error);
    return NextResponse.json({ error: "Unable to update task" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: TaskRouteContext) {
  const { taskId } = await context.params;
  return await deleteTask(taskId) ? new NextResponse(null, { status: 204 }) : NextResponse.json({ error: "Task not found" }, { status: 404 });
}
