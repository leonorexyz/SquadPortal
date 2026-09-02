import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { ticketReplies, tickets, users } from "@/db/schema";
import type { TicketReplyInput } from "./reply-schema";

export const DEFAULT_TICKET_REPLY_USER_ID = "demo-user";

async function ensureReplyUser(userId: string) {
  await db.insert(users).values({
    id: userId,
    email: userId === DEFAULT_TICKET_REPLY_USER_ID ? "sarah@squad.local" : `${userId}@squad.local`,
    name: userId === DEFAULT_TICKET_REPLY_USER_ID ? "Sarah Anderson" : userId,
    role: "viewer",
    status: "active",
  }).onConflictDoNothing().run();
}

function mapReply(reply: typeof ticketReplies.$inferSelect) {
  return {
    id: reply.id,
    ticketId: reply.ticketId,
    userId: reply.userId,
    content: reply.content,
    createdAt: reply.createdAt.toISOString(),
  };
}

export async function listTicketReplies(ticketId: string) {
  const ticket = await db.select({ id: tickets.id }).from(tickets).where(eq(tickets.id, ticketId)).get();
  if (!ticket) return null;
  return (await db.select().from(ticketReplies).where(eq(ticketReplies.ticketId, ticketId)).orderBy(asc(ticketReplies.createdAt)).all()).map(mapReply);
}

export async function createTicketReply(ticketId: string, input: TicketReplyInput) {
  const ticket = await db.select({ id: tickets.id }).from(tickets).where(eq(tickets.id, ticketId)).get();
  if (!ticket) return { status: "missing-ticket" as const, reply: null };
  const userId = input.userId ?? DEFAULT_TICKET_REPLY_USER_ID;
  await ensureReplyUser(userId);
  const reply = { id: `reply-${crypto.randomUUID()}`, ticketId, userId, content: input.content, createdAt: new Date() };
  await db.insert(ticketReplies).values(reply).run();
  await db.update(tickets).set({ updatedAt: reply.createdAt }).where(eq(tickets.id, ticketId)).run();
  return { status: "ok" as const, reply: mapReply(reply) };
}

export async function deleteTicketReply(ticketId: string, replyId: string, userId: string) {
  const reply = await db.select().from(ticketReplies)
    .where(and(eq(ticketReplies.id, replyId), eq(ticketReplies.ticketId, ticketId)))
    .get();
  if (!reply) return { status: "missing" as const };
  const user = await db.select({ role: users.role }).from(users).where(eq(users.id, userId)).get();
  if (reply.userId !== userId && user?.role !== "admin") return { status: "forbidden" as const };
  await db.delete(ticketReplies).where(eq(ticketReplies.id, replyId)).run();
  await db.update(tickets).set({ updatedAt: new Date() }).where(eq(tickets.id, ticketId)).run();
  return { status: "ok" as const };
}
