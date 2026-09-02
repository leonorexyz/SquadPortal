import { eq } from "drizzle-orm";
import { db } from "../../db";
import { users } from "../../db/schema";

export type UserRole = "admin" | "editor" | "viewer";

export async function getRequestUser(request: Request) {
  const userId = request.headers.get("x-user-id") ?? "demo-user";
  return await db.select({ id: users.id, role: users.role, status: users.status }).from(users).where(eq(users.id, userId)).get() ?? null;
}

export async function authorizeRequest(request: Request, allowedRoles: UserRole[]) {
  const user = await getRequestUser(request);
  if (!user || user.status !== "active") return { status: 401 as const };
  if (!allowedRoles.includes(user.role)) return { status: 403 as const, user };
  return { status: 200 as const, user };
}
