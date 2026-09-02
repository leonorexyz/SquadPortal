import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { DEFAULT_TICKET_CREATOR_ID, deleteTicket, getTicket, updateTicket } from "@/lib/tickets/service";
import { ticketResponseSchema, ticketUpdateSchema } from "@/lib/tickets/schema";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ ticketId: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const { ticketId } = await context.params;
  const ticket = await getTicket(ticketId);
  return ticket ? NextResponse.json(ticketResponseSchema.parse(ticket)) : NextResponse.json({ error: "Ticket not found" }, { status: 404 });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { ticketId } = await context.params;
    const userId = request.headers.get("x-user-id") ?? DEFAULT_TICKET_CREATOR_ID;
    const result = await updateTicket(ticketId, userId, ticketUpdateSchema.parse(await request.json()));
    if (result.status === "missing") return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    if (result.status === "forbidden") return NextResponse.json({ error: "You do not have access to update this ticket" }, { status: 403 });
    if (result.status === "invalid-assignee") return NextResponse.json({ error: "Assigned user not found" }, { status: 400 });
    return NextResponse.json(ticketResponseSchema.parse(result.ticket));
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: "Invalid ticket payload", details: error.flatten() }, { status: 400 });
    console.error("Failed to update ticket", error);
    return NextResponse.json({ error: "Unable to update ticket" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { ticketId } = await context.params;
  const userId = request.headers.get("x-user-id") ?? DEFAULT_TICKET_CREATOR_ID;
  const result = await deleteTicket(ticketId, userId);
  if (result.status === "missing") return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  if (result.status === "forbidden") return NextResponse.json({ error: "You do not have access to delete this ticket" }, { status: 403 });
  return new NextResponse(null, { status: 204 });
}
