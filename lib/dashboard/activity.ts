import { desc, eq } from "drizzle-orm";
import { db } from "../../db";
import { stories, tickets, users } from "../../db/schema";

const DEFAULT_ACTIVITY_LIMIT = 10;

function toIsoString(value: Date) {
  return value.toISOString();
}

export async function getRecentActivity(limit = DEFAULT_ACTIVITY_LIMIT) {
  const storyActivities = (await db
    .select({
      id: stories.id,
      person: users.name,
      content: stories.content,
      createdAt: stories.createdAt,
    })
    .from(stories)
    .leftJoin(users, eq(stories.userId, users.id))
    .orderBy(desc(stories.createdAt))
    .limit(limit)
    .all())
    .map((story: { id: string; person: string | null; content: string; createdAt: Date }) => ({
      id: `story-${story.id}`,
      type: "story" as const,
      person: story.person ?? "Unknown member",
      action: "added a new daily story",
      item: story.content.length > 120 ? `${story.content.slice(0, 117)}...` : story.content,
      createdAt: toIsoString(story.createdAt),
    }));

  const ticketActivities = (await db
    .select({
      id: tickets.id,
      person: users.name,
      title: tickets.title,
      status: tickets.status,
      createdAt: tickets.createdAt,
    })
    .from(tickets)
    .leftJoin(users, eq(tickets.createdBy, users.id))
    .orderBy(desc(tickets.createdAt))
    .limit(limit)
    .all())
    .map((ticket: { id: string; person: string | null; title: string; status: string; createdAt: Date }) => ({
      id: `ticket-${ticket.id}`,
      type: "ticket" as const,
      person: ticket.person ?? "Unknown member",
      action: "opened a team ticket",
      item: ticket.title,
      status: ticket.status,
      createdAt: toIsoString(ticket.createdAt),
    }));

  const data = [...storyActivities, ...ticketActivities]
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .slice(0, limit);

  return {
    data,
    meta: {
      limit,
      sourceTypes: ["story", "ticket"] as const,
      generatedAt: new Date().toISOString(),
    },
  };
}
