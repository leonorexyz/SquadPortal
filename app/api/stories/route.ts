import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { createStory, listStories } from "../../../lib/stories/service";
import { storyInputSchema, storyListQuerySchema, storyListResponseSchema, storyResponseSchema } from "../../../lib/stories/schema";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const queryResult = storyListQuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams.entries()));
  if (!queryResult.success) return NextResponse.json({ error: "Invalid story filters", details: queryResult.error.flatten() }, { status: 400 });
  const data = await listStories(queryResult.data.userId, { from: queryResult.data.from, to: queryResult.data.to });
  return NextResponse.json(storyListResponseSchema.parse({ data, meta: { count: data.length } }));
}

export async function POST(request: NextRequest) {
  try {
    const input = storyInputSchema.parse(await request.json());
    return NextResponse.json(storyResponseSchema.parse(await createStory(input)), { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: "Invalid story payload", details: error.flatten() }, { status: 400 });
    console.error("Failed to create story", error);
    return NextResponse.json({ error: "Unable to create story" }, { status: 500 });
  }
}
