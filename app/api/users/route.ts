import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { createUser, listUsers } from "../../../lib/users/service";
import { userInputSchema, userListQuerySchema, userListResponseSchema, userResponseSchema } from "../../../lib/users/schema";
import { authorizeRequest } from "../../../lib/auth/permissions";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authorization = await authorizeRequest(request, ["admin", "editor", "viewer"]);
  if (authorization.status === 401) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const queryResult = userListQuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams.entries()));
  if (!queryResult.success) return NextResponse.json({ error: "Invalid user filters", details: queryResult.error.flatten() }, { status: 400 });
  const data = await listUsers(queryResult.data);
  return NextResponse.json(userListResponseSchema.parse({ data, meta: { count: data.length } }));
}

export async function POST(request: NextRequest) {
  const authorization = await authorizeRequest(request, ["admin"]);
  if (authorization.status === 401) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (authorization.status === 403) return NextResponse.json({ error: "Only admins can create users" }, { status: 403 });
  try {
    const input = userInputSchema.parse(await request.json());
    return NextResponse.json(userResponseSchema.parse(await createUser(input)), { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: "Invalid user payload", details: error.flatten() }, { status: 400 });
    if (error instanceof Error && error.message.includes("UNIQUE constraint failed")) return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
    console.error("Failed to create user", error);
    return NextResponse.json({ error: "Unable to create user" }, { status: 500 });
  }
}
