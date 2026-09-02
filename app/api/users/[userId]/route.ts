import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { deleteUser, getUser, updateUser } from "../../../../lib/users/service";
import { userResponseSchema, userUpdateSchema } from "../../../../lib/users/schema";
import { authorizeRequest } from "../../../../lib/auth/permissions";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, context: { params: Promise<{ userId: string }> }) {
  const authorization = await authorizeRequest(_request, ["admin", "editor", "viewer"]);
  if (authorization.status === 401) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const { userId } = await context.params;
  const user = await getUser(userId);
  return user ? NextResponse.json(userResponseSchema.parse(user)) : NextResponse.json({ error: "User not found" }, { status: 404 });
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ userId: string }> }) {
  const authorization = await authorizeRequest(request, ["admin"]);
  if (authorization.status === 401) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (authorization.status === 403) return NextResponse.json({ error: "Only admins can update users" }, { status: 403 });
  const { userId } = await context.params;
  try {
    const input = userUpdateSchema.parse(await request.json());
    const user = await updateUser(userId, input);
    return user ? NextResponse.json(userResponseSchema.parse(user)) : NextResponse.json({ error: "User not found" }, { status: 404 });
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: "Invalid user payload", details: error.flatten() }, { status: 400 });
    if (error instanceof Error && error.message.includes("UNIQUE constraint failed")) return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
    console.error("Failed to update user", error);
    return NextResponse.json({ error: "Unable to update user" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ userId: string }> }) {
  const authorization = await authorizeRequest(_request, ["admin"]);
  if (authorization.status === 401) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (authorization.status === 403) return NextResponse.json({ error: "Only admins can delete users" }, { status: 403 });
  const { userId } = await context.params;
  return await deleteUser(userId) ? NextResponse.json({ data: { id: userId, deleted: true } }) : NextResponse.json({ error: "User not found" }, { status: 404 });
}
