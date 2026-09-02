import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { DEFAULT_TICKET_CREATOR_ID, createTicket, listTickets } from "@/lib/tickets/service";
import { ticketInputSchema, ticketListQuerySchema, ticketListResponseSchema, ticketResponseSchema } from "@/lib/tickets/schema";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const queryResult = ticketListQuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams.entries()));
  if (!queryResult.success) return NextResponse.json({ error: "Invalid ticket filters", details: queryResult.error.flatten() }, { status: 400 });
  const data = await listTickets(queryResult.data);
  return NextResponse.json(ticketListResponseSchema.parse({ data, meta: { count: data.length } }));
}

export async function POST(request: NextRequest) {
  try {
    const createdBy = request.headers.get("x-user-id") ?? DEFAULT_TICKET_CREATOR_ID;
    const result = await createTicket(ticketInputSchema.parse({ ...(await request.json()), createdBy }));
    if (result.status === "invalid-assignee") return NextResponse.json({ error: "Assigned user not found" }, { status: 400 });
    return NextResponse.json(ticketResponseSchema.parse(result.ticket), { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: "Invalid ticket payload", details: error.flatten() }, { status: 400 });
    console.error("Failed to create ticket", error);
    return NextResponse.json({ error: "Unable to create ticket" }, { status: 500 });
  }
}
