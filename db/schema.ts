import { relations, sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

const createdAt = (name: string) => integer(name, { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`);

export const users = sqliteTable("users", {
  id: text("id").primaryKey().notNull(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  passwordHash: text("password_hash"),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
  image: text("image"),
  role: text("role", { enum: ["admin", "editor", "viewer"] }).notNull().default("viewer"),
  status: text("status", { enum: ["active", "inactive"] }).notNull().default("active"),
  avatarUrl: text("avatar_url"),
  createdAt: createdAt("created_at"),
  updatedAt: createdAt("updated_at"),
}, (table) => ({
  emailUnique: uniqueIndex("users_email_unique").on(table.email),
  statusIndex: index("users_status_idx").on(table.status),
}));

export const notificationPreferences = sqliteTable("notification_preferences", {
  userId: text("user_id").primaryKey().notNull().references(() => users.id, { onDelete: "cascade" }),
  ticketReplies: integer("ticket_replies", { mode: "boolean" }).notNull().default(true),
  projectUpdates: integer("project_updates", { mode: "boolean" }).notNull().default(true),
  weeklySummary: integer("weekly_summary", { mode: "boolean" }).notNull().default(false),
  createdAt: createdAt("created_at"),
  updatedAt: createdAt("updated_at"),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey().notNull(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  token: text("token").notNull(),
  createdAt: createdAt("created_at"),
  updatedAt: createdAt("updated_at"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
}, (table) => ({
  tokenUnique: uniqueIndex("sessions_token_unique").on(table.token),
  userIndex: index("sessions_user_idx").on(table.userId),
}));

export const accounts = sqliteTable("accounts", {
  id: text("id").primaryKey().notNull(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  issuer: text("issuer").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp_ms" }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp_ms" }),
  scope: text("scope"),
  password: text("password"),
  createdAt: createdAt("created_at"),
  updatedAt: createdAt("updated_at"),
}, (table) => ({
  issuerAccountUnique: uniqueIndex("accounts_issuer_account_unique").on(table.issuer, table.accountId),
  userIndex: index("accounts_user_idx").on(table.userId),
}));

export const verifications = sqliteTable("verifications", {
  id: text("id").primaryKey().notNull(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  createdAt: createdAt("created_at"),
  updatedAt: createdAt("updated_at"),
}, (table) => ({
  identifierIndex: index("verifications_identifier_idx").on(table.identifier),
}));

export const projects = sqliteTable("projects", {
  id: text("id").primaryKey().notNull(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  client: text("client"),
  status: text("status", { enum: ["preparation", "development", "sit", "uat", "go-live", "support", "implementation"] }).notNull().default("preparation"),
  visibility: text("visibility", { enum: ["internal", "public"] }).notNull().default("internal"),
  dueDate: text("due_date"),
  ownerId: text("owner_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  createdAt: createdAt("created_at"),
}, (table) => ({
  ownerIndex: index("projects_owner_idx").on(table.ownerId),
  statusIndex: index("projects_status_idx").on(table.status),
  visibilityIndex: index("projects_visibility_idx").on(table.visibility),
}));

export const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey().notNull(),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status", { enum: ["todo", "inprogress", "done"] }).notNull().default("todo"),
  assigneeId: text("assignee_id").references(() => users.id, { onDelete: "set null" }),
  dueDate: text("due_date"),
  googleDocId: text("google_doc_id"),
  createdAt: createdAt("created_at"),
  updatedAt: createdAt("updated_at"),
}, (table) => ({
  projectIndex: index("tasks_project_idx").on(table.projectId),
  assigneeIndex: index("tasks_assignee_idx").on(table.assigneeId),
  statusIndex: index("tasks_status_idx").on(table.status),
  dueDateIndex: index("tasks_due_date_idx").on(table.dueDate),
  updatedAtIndex: index("tasks_updated_at_idx").on(table.updatedAt),
}));

export const stories = sqliteTable("stories", {
  id: text("id").primaryKey().notNull(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  storyDate: text("story_date").notNull(),
  visibility: text("visibility", { enum: ["private", "team"] }).notNull().default("private"),
  createdAt: createdAt("created_at"),
  updatedAt: createdAt("updated_at"),
}, (table) => ({
  userDateIndex: index("stories_user_date_idx").on(table.userId, table.storyDate),
  visibilityDateIndex: index("stories_visibility_date_idx").on(table.visibility, table.storyDate),
}));

export const knowledgeArticles = sqliteTable("knowledge_articles", {
  id: text("id").primaryKey().notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category"),
  fileName: text("file_name"),
  fileUrl: text("file_url"),
  mimeType: text("mime_type"),
  fileSize: integer("file_size"),
  visibility: text("visibility", { enum: ["internal", "public"] }).notNull().default("internal"),
  authorId: text("author_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  createdAt: createdAt("created_at"),
  updatedAt: createdAt("updated_at"),
}, (table) => ({
  authorIndex: index("knowledge_articles_author_idx").on(table.authorId),
  categoryIndex: index("knowledge_articles_category_idx").on(table.category),
  visibilityIndex: index("knowledge_articles_visibility_idx").on(table.visibility),
}));

export const tickets = sqliteTable("tickets", {
  id: text("id").primaryKey().notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: text("status", { enum: ["open", "inprogress", "closed"] }).notNull().default("open"),
  priority: text("priority", { enum: ["high", "medium", "low"] }).notNull().default("medium"),
  category: text("category").notNull().default("Question"),
  createdBy: text("created_by").notNull().references(() => users.id, { onDelete: "restrict" }),
  assignedTo: text("assigned_to").references(() => users.id, { onDelete: "set null" }),
  createdAt: createdAt("created_at"),
  updatedAt: createdAt("updated_at"),
}, (table) => ({
  creatorIndex: index("tickets_creator_idx").on(table.createdBy),
  assigneeIndex: index("tickets_assignee_idx").on(table.assignedTo),
  statusIndex: index("tickets_status_idx").on(table.status),
  priorityIndex: index("tickets_priority_idx").on(table.priority),
  categoryIndex: index("tickets_category_idx").on(table.category),
}));

export const ticketReplies = sqliteTable("ticket_replies", {
  id: text("id").primaryKey().notNull(),
  ticketId: text("ticket_id").notNull().references(() => tickets.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  content: text("content").notNull(),
  createdAt: createdAt("created_at"),
}, (table) => ({
  ticketIndex: index("ticket_replies_ticket_idx").on(table.ticketId),
  userIndex: index("ticket_replies_user_idx").on(table.userId),
}));

export const googleIntegrations = sqliteTable("google_integrations", {
  id: text("id").primaryKey().notNull(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token").notNull(),
  tokenExpiry: integer("token_expiry", { mode: "timestamp_ms" }).notNull(),
  createdAt: createdAt("created_at"),
}, (table) => ({
  userUnique: uniqueIndex("google_integrations_user_unique").on(table.userId),
}));

export const googleProjectSources = sqliteTable("google_project_sources", {
  id: text("id").primaryKey().notNull(),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  documentId: text("document_id").notNull(),
  documentName: text("document_name").notNull(),
  documentType: text("document_type", { enum: ["sheet", "doc"] }).notNull(),
  range: text("range").notNull().default("Tasks!A1:G"),
  syncEnabled: integer("sync_enabled", { mode: "boolean" }).notNull().default(true),
  lastSyncedAt: integer("last_synced_at", { mode: "timestamp_ms" }),
  createdAt: createdAt("created_at"),
  updatedAt: createdAt("updated_at"),
}, (table) => ({
  projectIndex: index("google_project_sources_project_idx").on(table.projectId),
  userIndex: index("google_project_sources_user_idx").on(table.userId),
  projectDocumentUnique: uniqueIndex("google_project_sources_project_document_unique").on(table.projectId, table.documentId),
}));

export const sharePermissions = sqliteTable("share_permissions", {
  id: text("id").primaryKey().notNull(),
  resourceType: text("resource_type", { enum: ["project", "knowledge"] }).notNull(),
  resourceId: text("resource_id").notNull(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  permission: text("permission", { enum: ["read", "write"] }).notNull().default("read"),
  createdAt: createdAt("created_at"),
}, (table) => ({
  resourceIndex: index("share_permissions_resource_idx").on(table.resourceType, table.resourceId),
  userIndex: index("share_permissions_user_idx").on(table.userId),
  resourceUserUnique: uniqueIndex("share_permissions_resource_user_unique").on(table.resourceType, table.resourceId, table.userId),
  resourceTypeCheck: check("share_permissions_resource_type_check", sql`${table.resourceType} in ('project', 'knowledge')`),
}));

export const usersRelations = relations(users, ({ many, one }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
  ownedProjects: many(projects, { relationName: "projectOwner" }),
  assignedTasks: many(tasks, { relationName: "taskAssignee" }),
  stories: many(stories),
  knowledgeArticles: many(knowledgeArticles),
  createdTickets: many(tickets, { relationName: "ticketCreator" }),
  assignedTickets: many(tickets, { relationName: "ticketAssignee" }),
  ticketReplies: many(ticketReplies),
  googleIntegrations: many(googleIntegrations),
  googleProjectSources: many(googleProjectSources),
  sharePermissions: many(sharePermissions),
  notificationPreferences: one(notificationPreferences),
}));

export const notificationPreferencesRelations = relations(notificationPreferences, ({ one }) => ({
  user: one(users, { fields: [notificationPreferences.userId], references: [users.id] }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  owner: one(users, { fields: [projects.ownerId], references: [users.id], relationName: "projectOwner" }),
  tasks: many(tasks),
  googleProjectSources: many(googleProjectSources),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  project: one(projects, { fields: [tasks.projectId], references: [projects.id] }),
  assignee: one(users, { fields: [tasks.assigneeId], references: [users.id], relationName: "taskAssignee" }),
}));

export const storiesRelations = relations(stories, ({ one }) => ({
  user: one(users, { fields: [stories.userId], references: [users.id] }),
}));

export const knowledgeArticlesRelations = relations(knowledgeArticles, ({ one, many }) => ({
  author: one(users, { fields: [knowledgeArticles.authorId], references: [users.id] }),
  sharePermissions: many(sharePermissions),
}));

export const ticketsRelations = relations(tickets, ({ one, many }) => ({
  creator: one(users, { fields: [tickets.createdBy], references: [users.id], relationName: "ticketCreator" }),
  assignee: one(users, { fields: [tickets.assignedTo], references: [users.id], relationName: "ticketAssignee" }),
  replies: many(ticketReplies),
}));

export const ticketRepliesRelations = relations(ticketReplies, ({ one }) => ({
  ticket: one(tickets, { fields: [ticketReplies.ticketId], references: [tickets.id] }),
  user: one(users, { fields: [ticketReplies.userId], references: [users.id] }),
}));

export const googleIntegrationsRelations = relations(googleIntegrations, ({ one }) => ({
  user: one(users, { fields: [googleIntegrations.userId], references: [users.id] }),
}));

export const googleProjectSourcesRelations = relations(googleProjectSources, ({ one }) => ({
  project: one(projects, { fields: [googleProjectSources.projectId], references: [projects.id] }),
  user: one(users, { fields: [googleProjectSources.userId], references: [users.id] }),
}));

export const sharePermissionsRelations = relations(sharePermissions, ({ one }) => ({
  user: one(users, { fields: [sharePermissions.userId], references: [users.id] }),
}));
