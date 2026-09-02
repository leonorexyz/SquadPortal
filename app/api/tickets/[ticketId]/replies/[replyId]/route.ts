import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_TICKET_REPLY_USER_ID, deleteTicketReply } from "@/lib/tickets/reply-service";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ ticketId: string; replyId: string }> };

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { ticketId, replyId } = await context.params;
  const userId = request.headers.get("x-user-id") ?? DEFAULT_TICKET_REPLY_USER_ID;
  const result = await deleteTicketReply(ticketId, replyId, userId);
  if (result.status === "missing") return NextResponse.json({ error: "Ticket reply not found" }, { status: 404 });
  if (result.status === "forbidden") return NextResponse.json({ error: "You do not have access to delete this reply" }, { status: 403 });
  return new NextResponse(null, { status: 204 });
}
