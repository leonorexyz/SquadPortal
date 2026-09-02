import { NextRequest, NextResponse } from "next/server";
import { ZodError, z } from "zod";
import { authorizeRequest } from "../../../../../lib/auth/permissions";
import { updateUser } from "../../../../../lib/users/service";
import { userResponseSchema, userStatusSchema } from "../../../../../lib/users/schema";

export const dynamic = "force-dynamic";

const statusUpdateSchema = z.object({ status: userStatusSchema });

export async function PATCH(request: NextRequest, context: { params: Promise<{ userId: string }> }) {
  const authorization = await authorizeRequest(request, ["admin"]);
  if (authorization.status === 401) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (authorization.status === 403) return NextResponse.json({ error: "Only admins can change user status" }, { status: 403 });

  try {
    const { userId } = await context.params;
    const { status } = statusUpdateSchema.parse(await request.json());
    const user = await updateUser(userId, { status });
    return user ? NextResponse.json(userResponseSchema.parse(user)) : NextResponse.json({ error: "User not found" }, { status: 404 });
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: "Invalid status payload", details: error.flatten() }, { status: 400 });
    console.error("Failed to update user status", error);
    return NextResponse.json({ error: "Unable to update user status" }, { status: 500 });
  }
}
