import { NextRequest, NextResponse } from "next/server";
import { authorizeRequest } from "../../../../lib/auth/permissions";
import { readProfileAvatar } from "../../../../lib/profile/files";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authorization = await authorizeRequest(request, ["admin", "editor", "viewer"]);
  if (authorization.status === 401) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const userId = request.nextUrl.searchParams.get("userId") ?? authorization.user.id;
  const avatar = readProfileAvatar(userId);
  return avatar ? new NextResponse(avatar.data, { headers: { "Content-Type": avatar.mime, "Cache-Control": "private, max-age=3600" } }) : NextResponse.json({ error: "Profile photo not found" }, { status: 404 });
}
