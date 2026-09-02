import { z } from "zod";

const nonNegativeInteger = z.number().int().nonnegative();
const generatedAt = z.string().min(1);

export const productivityMemberSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  value: z.number().min(0).max(100),
  storyCount: nonNegativeInteger,
  completedTaskCount: nonNegativeInteger,
  color: z.string().min(1),
});

export const productivityResponseSchema = z.object({
  data: z.array(productivityMemberSchema),
  meta: z.object({
    totalActivity: nonNegativeInteger,
    basis: z.literal("stories + completed tasks"),
    generatedAt,
  }),
});

const statusCountsSchema = z.record(z.string(), nonNegativeInteger);

export const dashboardSummaryResponseSchema = z.object({
  projects: z.object({
    active: nonNegativeInteger,
    total: nonNegativeInteger,
    byStatus: statusCountsSchema,
  }),
  tasks: z.object({
    completed: nonNegativeInteger,
    pending: nonNegativeInteger,
    dueThisWeek: nonNegativeInteger,
    total: nonNegativeInteger,
    byStatus: statusCountsSchema,
  }),
  members: z.object({
    active: nonNegativeInteger,
    online: nonNegativeInteger,
  }),
  generatedAt,
});

export const dashboardActivitySchema = z.object({
  id: z.string().min(1),
  type: z.enum(["story", "ticket"]),
  person: z.string().min(1),
  action: z.string().min(1),
  item: z.string().min(1),
  status: z.enum(["open", "inprogress", "closed"]).optional(),
  createdAt: generatedAt,
});

export const dashboardActivityResponseSchema = z.object({
  data: z.array(dashboardActivitySchema),
  meta: z.object({
    limit: nonNegativeInteger,
    sourceTypes: z.array(z.enum(["story", "ticket"])),
    generatedAt,
  }),
});

export const dashboardSearchResultSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["Project", "Task", "Knowledge", "Ticket"]),
  title: z.string().min(1),
  subtitle: z.string(),
  createdAt: generatedAt,
});

export const dashboardSearchResponseSchema = z.object({
  data: z.array(dashboardSearchResultSchema),
  meta: z.object({
    query: z.string(),
    count: nonNegativeInteger,
    limit: nonNegativeInteger.optional(),
    minQueryLength: nonNegativeInteger.optional(),
  }),
});

export type ProductivityMember = z.infer<typeof productivityMemberSchema>;
export type DashboardSummary = z.infer<typeof dashboardSummaryResponseSchema>;
export type DashboardActivity = z.infer<typeof dashboardActivitySchema>;
export type DashboardSearchResult = z.infer<typeof dashboardSearchResultSchema>;
