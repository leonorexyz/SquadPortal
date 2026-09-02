import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { DEFAULT_STORY_USER_ID, deleteStory, getStory, updateStory } from "../../../../lib/stories/service";
import { storyResponseSchema, storyUpdateSchema } from "../../../../lib/stories/schema";

export const dynamic = "force-dynamic";

type StoryRouteContext = { params: Promise<{ storyId: string }> };

export async function GET(request: NextRequest, context: StoryRouteContext) {
  const { storyId } = await context.params;
  const userId = request.nextUrl.searchParams.get("userId") ?? request.headers.get("x-user-id") ?? DEFAULT_STORY_USER_ID;
  const story = await getStory(storyId, userId);
  return story ? NextResponse.json(storyResponseSchema.parse(story)) : NextResponse.json({ error: "Story not found" }, { status: 404 });
}

export async function PATCH(request: NextRequest, context: StoryRouteContext) {
  try {
    const { storyId } = await context.params;
    const userId = request.headers.get("x-user-id") ?? DEFAULT_STORY_USER_ID;
    const input = storyUpdateSchema.parse(await request.json());
    const story = await updateStory(storyId, userId, input);
    return story ? NextResponse.json(storyResponseSchema.parse(story)) : NextResponse.json({ error: "Story not found" }, { status: 404 });
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: "Invalid story payload", details: error.flatten() }, { status: 400 });
    console.error("Failed to update story", error);
    return NextResponse.json({ error: "Unable to update story" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: StoryRouteContext) {
  const { storyId } = await context.params;
  const userId = _request.headers.get("x-user-id") ?? DEFAULT_STORY_USER_ID;
  return await deleteStory(storyId, userId) ? new NextResponse(null, { status: 204 }) : NextResponse.json({ error: "Story not found" }, { status: 404 });
}
