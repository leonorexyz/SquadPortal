import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { DEFAULT_TICKET_CREATOR_ID, updateTicket } from "@/lib/tickets/service";
import { ticketStatusResponseSchema, ticketStatusUpdateSchema } from "@/lib/tickets/status-schema";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ ticketId: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { ticketId } = await context.params;
    const userId = request.headers.get("x-user-id") ?? DEFAULT_TICKET_CREATOR_ID;
    const input = ticketStatusUpdateSchema.parse(await request.json());
    const result = await updateTicket(ticketId, userId, input);
    if (result.status === "missing") return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    if (result.status === "forbidden") return NextResponse.json({ error: "You do not have access to update this ticket" }, { status: 403 });
    return NextResponse.json(ticketStatusResponseSchema.parse(result.ticket));
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: "Invalid ticket status payload", details: error.flatten() }, { status: 400 });
    console.error("Failed to update ticket status", error);
    return NextResponse.json({ error: "Unable to update ticket status" }, { status: 500 });
  }
}
