import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth, googleAuthConfigured } from "../../../../../lib/auth";
import { authorizeRequest, type UserRole } from "../../../../../lib/auth/permissions";
import { db } from "../../../../../db";
import { users } from "../../../../../db/schema";
import { eq } from "drizzle-orm";
import { disconnectGoogleIntegration, getGoogleConnection, saveGoogleIntegration } from "../../../../../lib/google/integration";
import { googleConnectSchema, googleConnectionResponseSchema } from "../../../../../lib/google/integration-schema";

export const dynamic = "force-dynamic";

type AuthorizedUser = { id: string; role: UserRole };
type AuthorizationResult = { status: 200; user: AuthorizedUser } | { status: 401 } | { status: 403; user: AuthorizedUser };

async function authorizeGoogleRequest(request: NextRequest): Promise<AuthorizationResult> {
  if (process.env.NEXT_PUBLIC_AUTH_MOCK !== "false") return authorizeRequest(request, ["admin", "editor", "viewer"]);

  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return { status: 401 };

  const user = await db.select({ id: users.id, role: users.role, status: users.status }).from(users).where(eq(users.id, session.user.id)).get();
  if (!user || user.status !== "active") return { status: 401 };
  return { status: 200, user: { id: user.id, role: user.role } };
}

function unauthorizedResponse(authorization: AuthorizationResult) {
  if (authorization.status === 401) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (authorization.status === 403) return NextResponse.json({ error: "You do not have access to Google integrations" }, { status: 403 });
  return null;
}

export async function GET(request: NextRequest) {
  const authorization = await authorizeGoogleRequest(request);
  const errorResponse = unauthorizedResponse(authorization);
  if (authorization.status !== 200) return errorResponse as NextResponse;
  return NextResponse.json(googleConnectionResponseSchema.parse(await getGoogleConnection(authorization.user.id)));
}

export async function POST(request: NextRequest) {
  const authorization = await authorizeGoogleRequest(request);
  const errorResponse = unauthorizedResponse(authorization);
  if (authorization.status !== 200) return errorResponse as NextResponse;

  let input: ReturnType<typeof googleConnectSchema.parse>;
  try {
    input = googleConnectSchema.parse(await request.json().catch(() => ({})));
  } catch (error) {
    return NextResponse.json({ error: "Invalid Google connection payload", details: error instanceof ZodError ? error.flatten() : undefined }, { status: 400 });
  }

  if (input.accessToken && input.refreshToken) {
    const connection = await saveGoogleIntegration(authorization.user.id, input);
    return NextResponse.json(googleConnectionResponseSchema.parse(connection));
  }

  if (!googleAuthConfigured) {
    return NextResponse.json({ error: "Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET first." }, { status: 503 });
  }

  if (process.env.NEXT_PUBLIC_AUTH_MOCK !== "false") {
    return NextResponse.json({ error: "Google OAuth linking requires a Better Auth session." }, { status: 401 });
  }

  try {
    const callbackURL = input.callbackURL ?? `${process.env.BETTER_AUTH_URL ?? new URL(request.url).origin}/settings?tab=integrations`;
    const result = await auth.api.linkSocialAccount({
      body: {
        provider: "google",
        callbackURL,
        disableRedirect: true,
        scopes: input.scopes ?? ["openid", "email", "profile", "https://www.googleapis.com/auth/drive.file", "https://www.googleapis.com/auth/spreadsheets"],
      },
      headers: request.headers,
    });

    return NextResponse.json({ provider: "google", connected: false, authorizationUrl: result.url, redirect: result.redirect });
  } catch (error) {
    console.error("Failed to start Google OAuth connection", error);
    return NextResponse.json({ error: "Unable to start Google OAuth connection" }, { status: 502 });
  }
}

export async function DELETE(request: NextRequest) {
  const authorization = await authorizeGoogleRequest(request);
  const errorResponse = unauthorizedResponse(authorization);
  if (authorization.status !== 200) return errorResponse as NextResponse;
  const connection = await disconnectGoogleIntegration(authorization.user.id);
  return NextResponse.json(googleConnectionResponseSchema.parse(connection));
}
