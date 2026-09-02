import { NextResponse } from "next/server";
import { productivityResponseSchema } from "../../../../lib/dashboard/schema";
import { getProductivityAggregate } from "../../../../lib/dashboard/productivity";

export const dynamic = "force-dynamic";

const chartColors = ["#7357f6", "#61c9a0", "#f6b84e", "#e98282", "#5595ef", "#d47bf5"];

export async function GET() {
  try {
    return NextResponse.json(productivityResponseSchema.parse(await getProductivityAggregate()));
  } catch (error) {
    console.error("Failed to aggregate dashboard productivity", error);
    return NextResponse.json({ error: "Unable to load productivity data" }, { status: 500 });
  }
}
