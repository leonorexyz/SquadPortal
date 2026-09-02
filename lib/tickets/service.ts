import { and, desc, eq, like, or } from "drizzle-orm";
import { db } from "@/db";
import { tickets, users } from "@/db/schema";
import type { TicketInput, TicketUpdate } from "./schema";

export const DEFAULT_TICKET_CREATOR_ID = "demo-user";

async function ensureCreator(userId: string) {
  await db.insert(users).values({
    id: userId,
    email: userId === DEFAULT_TICKET_CREATOR_ID ? "sarah@squad.local" : `${userId}@squad.local`,
    name: userId === DEFAULT_TICKET_CREATOR_ID ? "Sarah Anderson" : userId,
    role: "admin",
    status: "active",
  }).onConflictDoNothing().run();
}

function mapTicket(ticket: typeof tickets.$inferSelect) {
  return {
    id: ticket.id,
    title: ticket.title,
    description: ticket.description,
    status: ticket.status,
    priority: ticket.priority,
    category: ticket.category,
    createdBy: ticket.createdBy,
    assignedTo: ticket.assignedTo,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
  };
}

export async function listTickets(options: { search?: string; status?: "open" | "inprogress" | "closed"; priority?: "high" | "medium" | "low"; category?: string } = {}) {
  const filters = [];
  if (options.search) {
    const pattern = `%${options.search}%`;
    filters.push(or(like(tickets.id, pattern), like(tickets.title, pattern), like(tickets.description, pattern), like(tickets.category, pattern)));
  }
  if (options.status) filters.push(eq(tickets.status, options.status));
  if (options.priority) filters.push(eq(tickets.priority, options.priority));
  if (options.category) filters.push(eq(tickets.category, options.category));
  const query = db.select().from(tickets);
  const rows = filters.length > 0 ? await query.where(and(...filters)).orderBy(desc(tickets.updatedAt)).all() : await query.orderBy(desc(tickets.updatedAt)).all();
  return rows.map(mapTicket);
}

export async function getTicket(ticketId: string) {
  const ticket = await db.select().from(tickets).where(eq(tickets.id, ticketId)).get();
  return ticket ? mapTicket(ticket) : null;
}

async function userCanManageTicket(ticket: typeof tickets.$inferSelect, userId: string) {
  if (ticket.createdBy === userId) return true;
  const user = await db.select({ role: users.role }).from(users).where(eq(users.id, userId)).get();
  return user?.role === "admin";
}

async function assignedUserExists(assignedTo: string | null | undefined) {
  return !assignedTo || Boolean(await db.select({ id: users.id }).from(users).where(eq(users.id, assignedTo)).get());
}

export async function createTicket(input: TicketInput) {
  const createdBy = input.createdBy ?? DEFAULT_TICKET_CREATOR_ID;
  await ensureCreator(createdBy);
  if (!await assignedUserExists(input.assignedTo)) return { status: "invalid-assignee" as const, ticket: null };
  const now = new Date();
  const ticket = {
    id: `ticket-${crypto.randomUUID()}`,
    title: input.title,
    description: input.description,
    status: input.status,
    priority: input.priority,
    category: input.category,
    createdBy,
    assignedTo: input.assignedTo ?? null,
    createdAt: now,
    updatedAt: now,
  };
  await db.insert(tickets).values(ticket).run();
  return { status: "ok" as const, ticket: mapTicket(ticket) };
}

export async function updateTicket(ticketId: string, userId: string, input: TicketUpdate) {
  const current = await db.select().from(tickets).where(eq(tickets.id, ticketId)).get();
  if (!current) return { status: "missing" as const, ticket: null };
  if (!await userCanManageTicket(current, userId)) return { status: "forbidden" as const, ticket: null };
  if (!await assignedUserExists(input.assignedTo)) return { status: "invalid-assignee" as const, ticket: null };
  const updatedAt = new Date();
  await db.update(tickets).set({ ...input, updatedAt }).where(eq(tickets.id, ticketId)).run();
  return { status: "ok" as const, ticket: mapTicket({ ...current, ...input, updatedAt }) };
}

export async function deleteTicket(ticketId: string, userId: string) {
  const current = await db.select().from(tickets).where(eq(tickets.id, ticketId)).get();
  if (!current) return { status: "missing" as const, ticket: null };
  if (!await userCanManageTicket(current, userId)) return { status: "forbidden" as const, ticket: null };
  await db.delete(tickets).where(eq(tickets.id, ticketId)).run();
  return { status: "ok" as const, ticket: mapTicket(current) };
}
