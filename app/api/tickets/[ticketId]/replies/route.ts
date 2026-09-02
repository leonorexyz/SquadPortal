import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { DEFAULT_TICKET_REPLY_USER_ID, createTicketReply, listTicketReplies } from "@/lib/tickets/reply-service";
import { ticketReplyInputSchema, ticketReplyListResponseSchema, ticketReplyResponseSchema } from "@/lib/tickets/reply-schema";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ ticketId: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const { ticketId } = await context.params;
  const data = await listTicketReplies(ticketId);
  return data ? NextResponse.json(ticketReplyListResponseSchema.parse({ data, meta: { count: data.length } })) : NextResponse.json({ error: "Ticket not found" }, { status: 404 });
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { ticketId } = await context.params;
    const userId = request.headers.get("x-user-id") ?? DEFAULT_TICKET_REPLY_USER_ID;
    const result = await createTicketReply(ticketId, ticketReplyInputSchema.parse({ ...(await request.json()), userId }));
    if (result.status === "missing-ticket") return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    return NextResponse.json(ticketReplyResponseSchema.parse(result.reply), { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: "Invalid ticket reply payload", details: error.flatten() }, { status: 400 });
    console.error("Failed to create ticket reply", error);
    return NextResponse.json({ error: "Unable to create ticket reply" }, { status: 500 });
  }
}
