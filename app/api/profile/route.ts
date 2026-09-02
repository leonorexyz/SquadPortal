import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { authorizeRequest } from "../../../lib/auth/permissions";
import { storeProfileAvatar } from "../../../lib/profile/files";
import { profileUpdateSchema } from "../../../lib/profile/schema";
import { getUser, updateUser } from "../../../lib/users/service";
import { userResponseSchema } from "../../../lib/users/schema";

export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest) {
  const authorization = await authorizeRequest(request, ["admin", "editor", "viewer"]);
  if (authorization.status === 401) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const userId = authorization.user.id;

  try {
    let input = {};
    let avatarUrl: string | undefined;
    if (request.headers.get("content-type")?.includes("multipart/form-data")) {
      const form = await request.formData();
      const name = form.get("name");
      input = profileUpdateSchema.parse(name === null ? {} : { name: String(name) });
      const file = form.get("file");
      if (file && typeof file !== "string" && "arrayBuffer" in file) avatarUrl = await storeProfileAvatar(userId, file);
    } else {
      input = profileUpdateSchema.parse(await request.json());
    }
    if (Object.keys(input).length === 0 && !avatarUrl) return NextResponse.json({ error: "Provide a name or profile photo" }, { status: 400 });
    const updated = await updateUser(userId, avatarUrl ? { ...input, avatarUrl } : input);
    return updated ? NextResponse.json(userResponseSchema.parse(updated)) : NextResponse.json({ error: "User not found" }, { status: 404 });
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: "Invalid profile payload", details: error.flatten() }, { status: 400 });
    if (error instanceof Error && (error.message.includes("Profile photo") || error.message.includes("profile photo"))) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error("Failed to update profile", error);
    return NextResponse.json({ error: "Unable to update profile" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const authorization = await authorizeRequest(request, ["admin", "editor", "viewer"]);
  if (authorization.status === 401) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const user = await getUser(authorization.user.id);
  return user ? NextResponse.json(userResponseSchema.parse(user)) : NextResponse.json({ error: "User not found" }, { status: 404 });
}
