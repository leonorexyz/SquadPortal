import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { accounts, googleIntegrations, projects, tasks } from "@/db/schema";
import { getProject } from "@/lib/projects/service";
import type { GoogleSyncRequest } from "./sync-schema";

const DEFAULT_RANGE = "Tasks!A1:G";
const TASK_HEADERS = ["Task ID", "Title", "Description", "Status", "Assignee ID", "Due Date", "Google Doc ID"];

type GoogleCredential = {
  accessToken: string;
  expiresAt: Date | null;
};

type ImportedTask = {
  id?: string;
  title: string;
  description?: string;
  status: "todo" | "inprogress" | "done";
  assigneeId?: string;
  dueDate?: string;
  googleDocId?: string;
};

export class GoogleSyncError extends Error {
  constructor(public readonly code: string, message: string, public readonly status = 400) {
    super(message);
  }
}

function cellValue(value: unknown) {
  return value === null || value === undefined ? "" : String(value).trim();
}

function normalizeStatus(value: string): ImportedTask["status"] {
  const normalized = value.toLowerCase().replace(/[\s_-]+/g, "");
  if (normalized === "done" || normalized === "completed") return "done";
  if (normalized === "inprogress" || normalized === "doing") return "inprogress";
  return "todo";
}

function parseImportedRows(rows: unknown[][]): ImportedTask[] {
  if (rows.length === 0) return [];
  const firstRow = rows[0].map((value) => cellValue(value).toLowerCase());
  const hasHeader = firstRow.some((value) => value === "title" || value === "task title");
  const header = hasHeader ? firstRow : TASK_HEADERS.map((value) => value.toLowerCase());
  const dataRows = hasHeader ? rows.slice(1) : rows;
  const indexOf = (...names: string[]) => names.map((name) => header.indexOf(name)).find((index) => index >= 0) ?? -1;
  const indexes = {
    id: indexOf("task id", "id"),
    title: indexOf("title", "task title"),
    description: indexOf("description"),
    status: indexOf("status"),
    assigneeId: indexOf("assignee id", "assignee"),
    dueDate: indexOf("due date", "due"),
    googleDocId: indexOf("google doc id", "google id"),
  };

  return dataRows.map((row, rowIndex) => {
    const title = cellValue(row[indexes.title]);
    if (!title) throw new GoogleSyncError("INVALID_IMPORT_ROWS", `Imported row ${rowIndex + 1} is missing a title.`);
    return {
      id: cellValue(row[indexes.id]) || undefined,
      title,
      description: cellValue(row[indexes.description]) || undefined,
      status: normalizeStatus(cellValue(row[indexes.status])),
      assigneeId: cellValue(row[indexes.assigneeId]) || undefined,
      dueDate: cellValue(row[indexes.dueDate]) || undefined,
      googleDocId: cellValue(row[indexes.googleDocId]) || undefined,
    };
  });
}

async function exportProjectRows(projectId: string) {
  const projectTasks = await db.select().from(tasks).where(eq(tasks.projectId, projectId)).all() as Array<typeof tasks.$inferSelect>;
  return [
    TASK_HEADERS,
    ...projectTasks.map((task) => [
      task.id,
      task.title,
      task.description ?? "",
      task.status,
      task.assigneeId ?? "",
      task.dueDate ?? "",
      task.googleDocId ?? "",
    ]),
  ];
}

async function importProjectRows(projectId: string, rows: unknown[][]) {
  const importedTasks = parseImportedRows(rows);
  const existingTasks = await db.select().from(tasks).where(eq(tasks.projectId, projectId)).all() as Array<typeof tasks.$inferSelect>;
  const byId = new Map(existingTasks.map((task) => [task.id, task]));
  const byGoogleId = new Map(existingTasks.filter((task) => task.googleDocId).map((task) => [task.googleDocId as string, task]));
  let created = 0;
  let updated = 0;

  for (const importedTask of importedTasks) {
      const existing = (importedTask.id ? byId.get(importedTask.id) : undefined)
        ?? (importedTask.googleDocId ? byGoogleId.get(importedTask.googleDocId) : undefined);
      const values = {
        title: importedTask.title,
        description: importedTask.description ?? null,
        status: importedTask.status,
        assigneeId: importedTask.assigneeId ?? null,
        dueDate: importedTask.dueDate ?? null,
        googleDocId: importedTask.googleDocId ?? null,
      };

      if (existing) {
        await db.update(tasks).set(values).where(eq(tasks.id, existing.id)).run();
        updated += 1;
        continue;
      }

      const id = importedTask.id?.startsWith("task-") && !byId.has(importedTask.id)
        ? importedTask.id
        : `task-${crypto.randomUUID()}`;
      const now = new Date();
      await db.insert(tasks).values({ id, projectId, ...values, createdAt: now, updatedAt: now }).run();
      created += 1;
  }

  return { imported: importedTasks.length, created, updated };
}

async function getGoogleCredential(userId: string): Promise<GoogleCredential | null> {
  const account = await db.select({ accessToken: accounts.accessToken, accessTokenExpiresAt: accounts.accessTokenExpiresAt })
    .from(accounts)
    .where(and(eq(accounts.userId, userId), eq(accounts.providerId, "google")))
    .get();
  if (account?.accessToken) return { accessToken: account.accessToken, expiresAt: account.accessTokenExpiresAt };

  const integration = await db.select({ accessToken: googleIntegrations.accessToken, tokenExpiry: googleIntegrations.tokenExpiry })
    .from(googleIntegrations)
    .where(eq(googleIntegrations.userId, userId))
    .get();
  return integration ? { accessToken: integration.accessToken, expiresAt: integration.tokenExpiry } : null;
}

async function requireGoogleCredential(userId: string) {
  const credential = await getGoogleCredential(userId);
  if (!credential) throw new GoogleSyncError("GOOGLE_ACCOUNT_REQUIRED", "Connect a Google account before syncing.", 409);
  if (credential.expiresAt && credential.expiresAt.getTime() <= Date.now()) {
    throw new GoogleSyncError("GOOGLE_REAUTH_REQUIRED", "The Google access token has expired. Reconnect the account.", 401);
  }
  return credential;
}

async function googleSheetsRequest(url: string, credential: GoogleCredential, init: RequestInit = {}) {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${credential.accessToken}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    const detail = await response.text();
    if (response.status === 401 || response.status === 403) {
      throw new GoogleSyncError("GOOGLE_REAUTH_REQUIRED", "Google rejected the access token. Reconnect the account.", 401);
    }
    throw new GoogleSyncError("GOOGLE_API_ERROR", `Google Sheets request failed (${response.status}). ${detail.slice(0, 200)}`, 502);
  }
  return response.json() as Promise<Record<string, unknown>>;
}

async function readGoogleRows(spreadsheetId: string, range: string, credential: GoogleCredential) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}`;
  const response = await googleSheetsRequest(url, credential);
  return Array.isArray(response.values) ? response.values as unknown[][] : [];
}

async function writeGoogleRows(spreadsheetId: string, range: string, rows: unknown[][], credential: GoogleCredential) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
  await googleSheetsRequest(url, credential, {
    method: "PUT",
    body: JSON.stringify({ range, majorDimension: "ROWS", values: rows }),
  });
}

export async function syncProjectWithGoogle(projectId: string, userId: string, input: GoogleSyncRequest) {
  const project = await getProject(projectId);
  if (!project) throw new GoogleSyncError("PROJECT_NOT_FOUND", "Project not found.", 404);
  if (project.ownerId !== userId) throw new GoogleSyncError("PROJECT_FORBIDDEN", "You do not have access to sync this project.", 403);

  const range = input.range || DEFAULT_RANGE;
  const isRemoteRead = input.action === "import" || input.action === "sync";
  const isRemoteWrite = input.action === "export" || input.action === "sync";
  const needsRemote = !input.dryRun && ((isRemoteRead && !input.rows) || isRemoteWrite);
  const credential = needsRemote ? await requireGoogleCredential(userId) : null;
  if (needsRemote && !input.spreadsheetId) {
    throw new GoogleSyncError("SPREADSHEET_REQUIRED", "spreadsheetId is required for a Google Sheets operation.");
  }

  const remoteRows = input.rows ?? (credential && input.spreadsheetId ? await readGoogleRows(input.spreadsheetId, range, credential) : []);
  let imported = 0;
  if (input.action === "import" || input.action === "sync") {
    imported = input.dryRun ? parseImportedRows(remoteRows).length : (await importProjectRows(projectId, remoteRows)).imported;
  }

  const rows = await exportProjectRows(projectId);
  if (input.action === "export" || input.action === "sync") {
    if (!input.dryRun && credential && input.spreadsheetId) await writeGoogleRows(input.spreadsheetId, range, rows, credential);
  }

  return {
    projectId,
    provider: "sheets" as const,
    action: input.action,
    spreadsheetId: input.spreadsheetId ?? null,
    range,
    imported,
    exported: input.action === "export" || input.action === "sync" ? rows.length - 1 : 0,
    rows,
    dryRun: input.dryRun,
    remote: { attempted: needsRemote, completed: needsRemote },
  };
}
