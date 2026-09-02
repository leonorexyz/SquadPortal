import { NextResponse } from "next/server";
import { dashboardActivityResponseSchema } from "../../../../lib/dashboard/schema";
import { getRecentActivity } from "../../../../lib/dashboard/activity";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(dashboardActivityResponseSchema.parse(await getRecentActivity()));
  } catch (error) {
    console.error("Failed to load dashboard activity", error);
    return NextResponse.json({ error: "Unable to load recent activity" }, { status: 500 });
  }
}
