import { and, eq } from "drizzle-orm";
import { db } from "../../db";
import { accounts, users } from "../../db/schema";
import { auth } from "../auth";

export type UserRole = "admin" | "editor" | "viewer";

async function bootstrapFirstAuthenticatedAdmin(user: { id: string; role: UserRole; status: "active" | "inactive" }) {
  if (user.role !== "viewer" || user.status !== "active") return user;

  // Seed/demo users are not workspace owners. Only a real Better Auth account
  // can claim the first admin slot, and only while no authenticated admin exists.
  const linkedAccount = await db.select({ id: accounts.id }).from(accounts).where(eq(accounts.userId, user.id)).get();
  if (!linkedAccount) return user;

  const existingAdmin = await db
    .select({ id: users.id })
    .from(users)
    .innerJoin(accounts, eq(accounts.userId, users.id))
    .where(and(eq(users.role, "admin"), eq(users.status, "active")))
    .get();
  if (existingAdmin) return user;

  await db
    .update(users)
    .set({ role: "admin", updatedAt: new Date() })
    .where(and(eq(users.id, user.id), eq(users.role, "viewer"), eq(users.status, "active")))
    .run();

  return { ...user, role: "admin" as const };
}

export async function getRequestUser(request: Request) {
  const isMockAuth = process.env.NEXT_PUBLIC_AUTH_MOCK !== "false";
  const userId = isMockAuth
    ? request.headers.get("x-user-id") ?? "demo-user"
    : (await auth.api.getSession({ headers: request.headers }))?.user.id;
  if (!userId) return null;

  const user = await db.select({ id: users.id, role: users.role, status: users.status }).from(users).where(eq(users.id, userId)).get();
  return user ? bootstrapFirstAuthenticatedAdmin(user) : null;
}

export async function authorizeRequest(request: Request, allowedRoles: UserRole[]) {
  const user = await getRequestUser(request);
  if (!user || user.status !== "active") return { status: 401 as const };
  if (!allowedRoles.includes(user.role)) return { status: 403 as const, user };
  return { status: 200 as const, user };
}
