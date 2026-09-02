import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { authorizeRequest } from "../../../../lib/auth/permissions";
import { sendInvitationEmail } from "../../../../lib/email/invitations";
import { createInvitedUser } from "../../../../lib/users/service";
import { userInviteSchema, userResponseSchema } from "../../../../lib/users/schema";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const authorization = await authorizeRequest(request, ["admin"]);
  if (authorization.status === 401) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (authorization.status === 403) return NextResponse.json({ error: "Only admins can invite users" }, { status: 403 });

  try {
    const input = userInviteSchema.parse(await request.json());
    const user = await createInvitedUser(input);
    const invitation = await sendInvitationEmail(user.email);
    return NextResponse.json({ data: userResponseSchema.parse(user), invitation }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: "Invalid invitation payload", details: error.flatten() }, { status: 400 });
    if (error instanceof Error && error.message.includes("UNIQUE constraint failed")) return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
    console.error("Failed to invite user", error);
    return NextResponse.json({ error: "Unable to send user invitation" }, { status: 500 });
  }
}
