import { like, or } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../db";
import { knowledgeArticles, projects, tasks, tickets } from "../../../../db/schema";
import { dashboardSearchResponseSchema } from "../../../../lib/dashboard/schema";

export const dynamic = "force-dynamic";

const RESULT_LIMIT = 20;

type SearchResult = {
  id: string;
  type: "Project" | "Task" | "Knowledge" | "Ticket";
  title: string;
  subtitle: string;
  createdAt: Date;
};

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (query.length < 2) {
    return NextResponse.json(dashboardSearchResponseSchema.parse({ data: [], meta: { query, count: 0, minQueryLength: 2 } }));
  }

  try {
    const pattern = `%${query}%`;
    const projectResults: SearchResult[] = (await db
      .select({ id: projects.id, title: projects.name, subtitle: projects.description, createdAt: projects.createdAt })
      .from(projects)
      .where(or(like(projects.name, pattern), like(projects.description, pattern)))
      .all())
      .map((row: { id: string; title: string; subtitle: string; createdAt: Date }) => ({ ...row, type: "Project" as const }));

    const taskResults: SearchResult[] = (await db
      .select({ id: tasks.id, title: tasks.title, subtitle: tasks.description, createdAt: tasks.createdAt })
      .from(tasks)
      .where(or(like(tasks.title, pattern), like(tasks.description, pattern)))
      .all())
      .map((row: { id: string; title: string; subtitle: string | null; createdAt: Date }) => ({ ...row, subtitle: row.subtitle ?? "", type: "Task" as const }));

    const knowledgeResults: SearchResult[] = (await db
      .select({ id: knowledgeArticles.id, title: knowledgeArticles.title, subtitle: knowledgeArticles.category, createdAt: knowledgeArticles.updatedAt })
      .from(knowledgeArticles)
      .where(or(like(knowledgeArticles.title, pattern), like(knowledgeArticles.content, pattern), like(knowledgeArticles.category, pattern)))
      .all())
      .map((row: { id: string; title: string; subtitle: string | null; createdAt: Date }) => ({ ...row, subtitle: row.subtitle ?? "", type: "Knowledge" as const }));

    const ticketResults: SearchResult[] = (await db
      .select({ id: tickets.id, title: tickets.title, subtitle: tickets.description, createdAt: tickets.updatedAt })
      .from(tickets)
      .where(or(like(tickets.title, pattern), like(tickets.description, pattern)))
      .all())
      .map((row: { id: string; title: string; subtitle: string; createdAt: Date }) => ({ ...row, type: "Ticket" as const }));

    const data = [...projectResults, ...taskResults, ...knowledgeResults, ...ticketResults]
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
      .slice(0, RESULT_LIMIT)
      .map((result) => ({ ...result, createdAt: result.createdAt.toISOString() }));

    return NextResponse.json(dashboardSearchResponseSchema.parse({ data, meta: { query, count: data.length, limit: RESULT_LIMIT } }));
  } catch (error) {
    console.error("Failed to search dashboard resources", error);
    return NextResponse.json({ error: "Unable to search resources" }, { status: 500 });
  }
}
