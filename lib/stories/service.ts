import { and, desc, eq, gte, lte, or } from "drizzle-orm";
import { db } from "../../db";
import { stories, users } from "../../db/schema";
import { type StoryInput, type StoryUpdate } from "./schema";

export const DEFAULT_STORY_USER_ID = "demo-user";

async function ensureDemoUser() {
  await db.insert(users).values({ id: DEFAULT_STORY_USER_ID, email: "sarah@squad.local", name: "Sarah Anderson", role: "admin", status: "active" }).onConflictDoNothing().run();
}

function mapStory(story: typeof stories.$inferSelect) {
  return {
    id: story.id,
    userId: story.userId,
    content: story.content,
    storyDate: story.storyDate,
    visibility: story.visibility,
    createdAt: story.createdAt.toISOString(),
    updatedAt: story.updatedAt.toISOString(),
  };
}

export async function listStories(userId = DEFAULT_STORY_USER_ID, range: { from?: string; to?: string } = {}) {
  await ensureDemoUser();
  const filters = [or(eq(stories.userId, userId), eq(stories.visibility, "team"))];
  if (range.from) filters.push(gte(stories.storyDate, range.from));
  if (range.to) filters.push(lte(stories.storyDate, range.to));
  return (await db.select().from(stories).where(and(...filters)).orderBy(desc(stories.storyDate), desc(stories.createdAt)).all()).map(mapStory);
}

export async function getStory(storyId: string, userId = DEFAULT_STORY_USER_ID) {
  await ensureDemoUser();
  const story = await db.select().from(stories).where(and(eq(stories.id, storyId), or(eq(stories.userId, userId), eq(stories.visibility, "team")))).get();
  return story ? mapStory(story) : null;
}

export async function createStory(input: StoryInput) {
  const userId = input.userId ?? DEFAULT_STORY_USER_ID;
  await ensureDemoUser();
  const now = new Date();
  const story = { id: `story-${crypto.randomUUID()}`, userId, content: input.content, storyDate: input.storyDate, visibility: input.visibility, createdAt: now, updatedAt: now };
  await db.insert(stories).values(story).run();
  return mapStory(story);
}

export async function updateStory(storyId: string, userId: string, input: StoryUpdate) {
  const current = await db.select().from(stories).where(and(eq(stories.id, storyId), eq(stories.userId, userId))).get();
  if (!current) return null;
  const updatedAt = new Date();
  await db.update(stories).set({ ...input, updatedAt }).where(and(eq(stories.id, storyId), eq(stories.userId, userId))).run();
  return mapStory({ ...current, ...input, updatedAt });
}

export async function deleteStory(storyId: string, userId: string) {
  const result = await db.delete(stories).where(and(eq(stories.id, storyId), eq(stories.userId, userId))).run();
  return (result.rowsAffected ?? result.changes ?? 0) > 0;
}
