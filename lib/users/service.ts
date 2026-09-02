import { and, desc, eq, like, or } from "drizzle-orm";
import { db } from "../../db";
import { users } from "../../db/schema";
import { type UserInput, type UserInvite, type UserUpdate } from "./schema";

function mapUser(user: typeof users.$inferSelect) {
  const updatedAt = user.updatedAt ?? user.createdAt;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    emailVerified: user.emailVerified,
    image: user.image,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
  };
}

export async function listUsers(options: { search?: string; role?: "admin" | "editor" | "viewer"; status?: "active" | "inactive" } = {}) {
  const filters = [];
  if (options.role) filters.push(eq(users.role, options.role));
  if (options.status) filters.push(eq(users.status, options.status));
  if (options.search) {
    const pattern = `%${options.search}%`;
    filters.push(or(like(users.name, pattern), like(users.email, pattern)));
  }
  const query = db.select().from(users);
  const rows = filters.length > 0 ? await query.where(and(...filters)).orderBy(desc(users.createdAt)).all() : await query.orderBy(desc(users.createdAt)).all();
  return rows.map(mapUser);
}

export async function getUser(userId: string) {
  const user = await db.select().from(users).where(eq(users.id, userId)).get();
  return user ? mapUser(user) : null;
}

export async function createUser(input: UserInput) {
  const now = new Date();
  const user = {
    id: `user-${crypto.randomUUID()}`,
    name: input.name,
    email: input.email.toLowerCase(),
    passwordHash: null,
    role: input.role,
    status: input.status,
    emailVerified: input.emailVerified,
    image: input.image ?? null,
    avatarUrl: input.avatarUrl ?? null,
    createdAt: now,
    updatedAt: now,
  };
  await db.insert(users).values(user).run();
  return mapUser(user);
}

export async function createInvitedUser(input: UserInvite) {
  return createUser({ ...input, status: "inactive", emailVerified: false });
}

export async function updateUser(userId: string, input: UserUpdate) {
  const current = await db.select().from(users).where(eq(users.id, userId)).get();
  if (!current) return null;
  const update = { ...input, ...(input.email ? { email: input.email.toLowerCase() } : {}), updatedAt: new Date() };
  await db.update(users).set(update).where(eq(users.id, userId)).run();
  return mapUser({ ...current, ...update });
}

export async function deleteUser(userId: string) {
  const result = await db.delete(users).where(eq(users.id, userId)).run();
  return (result.rowsAffected ?? result.changes ?? 0) > 0;
}
