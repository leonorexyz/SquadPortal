import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { accounts, googleIntegrations } from "@/db/schema";
import { syncProjectWithGoogle } from "./sync";
import type { GoogleDocumentImport, GoogleDocumentsQuery } from "./documents-schema";

const GOOGLE_SHEET_MIME = "application/vnd.google-apps.spreadsheet";
const GOOGLE_DOC_MIME = "application/vnd.google-apps.document";

type GoogleCredential = { accessToken: string; expiresAt: Date | null };
type GoogleCell = string | number | boolean | null;

export class GoogleDocumentError extends Error {
  constructor(public readonly code: string, message: string, public readonly status = 400) {
    super(message);
  }
}

function normalizeRows(values: unknown[][]): GoogleCell[][] {
  return values.map((row) => row.map((cell) => {
    if (cell === null || cell === undefined) return null;
    if (typeof cell === "string" || typeof cell === "number" || typeof cell === "boolean") return cell;
    return String(cell);
  }));
}

async function getGoogleCredential(userId: string): Promise<GoogleCredential | null> {
  const account = await db.select({ accessToken: accounts.accessToken, expiresAt: accounts.accessTokenExpiresAt })
    .from(accounts)
    .where(and(eq(accounts.userId, userId), eq(accounts.providerId, "google")))
    .get();
  if (account?.accessToken) return { accessToken: account.accessToken, expiresAt: account.expiresAt };

  const integration = await db.select({ accessToken: googleIntegrations.accessToken, expiresAt: googleIntegrations.tokenExpiry })
    .from(googleIntegrations)
    .where(eq(googleIntegrations.userId, userId))
    .get();
  return integration ? { accessToken: integration.accessToken, expiresAt: integration.expiresAt } : null;
}

async function requireGoogleCredential(userId: string) {
  const credential = await getGoogleCredential(userId);
  if (!credential) throw new GoogleDocumentError("GOOGLE_ACCOUNT_REQUIRED", "Connect a Google account before browsing documents.", 409);
  if (credential.expiresAt && credential.expiresAt.getTime() <= Date.now()) {
    throw new GoogleDocumentError("GOOGLE_REAUTH_REQUIRED", "The Google access token has expired. Reconnect the account.", 401);
  }
  return credential;
}

async function googleRequest<T>(url: string, credential: GoogleCredential) {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${credential.accessToken}` },
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    const detail = await response.text();
    if (response.status === 401 || response.status === 403) throw new GoogleDocumentError("GOOGLE_REAUTH_REQUIRED", "Google rejected the access token. Reconnect the account.", 401);
    throw new GoogleDocumentError("GOOGLE_API_ERROR", `Google API request failed (${response.status}). ${detail.slice(0, 200)}`, 502);
  }
  return response.json() as Promise<T>;
}

function mapFile(file: { id?: string; name?: string; mimeType?: string; modifiedTime?: string; webViewLink?: string }) {
  const type = file.mimeType === GOOGLE_SHEET_MIME ? "sheet" : file.mimeType === GOOGLE_DOC_MIME ? "doc" : null;
  if (!file.id || !file.name || !file.mimeType || !type) return null;
  return {
    id: file.id,
    name: file.name,
    type,
    mimeType: file.mimeType,
    modifiedAt: file.modifiedTime ?? null,
    webUrl: file.webViewLink ?? null,
  } as const;
}

export async function listGoogleDocuments(userId: string, query: GoogleDocumentsQuery) {
  const credential = await requireGoogleCredential(userId);
  const mimeFilter = query.type === "sheet"
    ? `mimeType = '${GOOGLE_SHEET_MIME}'`
    : query.type === "doc"
      ? `mimeType = '${GOOGLE_DOC_MIME}'`
      : `(mimeType = '${GOOGLE_SHEET_MIME}' or mimeType = '${GOOGLE_DOC_MIME}')`;
  const params = new URLSearchParams({
    q: `trashed = false and ${mimeFilter}`,
    fields: "files(id,name,mimeType,modifiedTime,webViewLink)",
    orderBy: "modifiedTime desc",
    pageSize: "100",
  });
  const result = await googleRequest<{ files?: Array<{ id?: string; name?: string; mimeType?: string; modifiedTime?: string; webViewLink?: string }> }>(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, credential);
  return (result.files ?? []).map(mapFile).filter((file): file is NonNullable<ReturnType<typeof mapFile>> => Boolean(file));
}

async function getGoogleDocument(userId: string, documentId: string) {
  const credential = await requireGoogleCredential(userId);
  const params = new URLSearchParams({ fields: "id,name,mimeType,modifiedTime,webViewLink" });
  const file = await googleRequest<{ id?: string; name?: string; mimeType?: string; modifiedTime?: string; webViewLink?: string }>(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(documentId)}?${params.toString()}`, credential);
  const document = mapFile(file);
  if (!document) throw new GoogleDocumentError("GOOGLE_DOCUMENT_UNSUPPORTED", "Only Google Sheets and Google Docs can be imported.", 400);
  return { document, credential };
}

export async function importGoogleDocument(userId: string, input: GoogleDocumentImport) {
  const { document, credential } = await getGoogleDocument(userId, input.documentId);
  if (document.type !== "sheet") throw new GoogleDocumentError("GOOGLE_SHEET_REQUIRED", "Importing tasks requires a Google Sheet.", 400);

  const sheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(input.documentId)}/values/${encodeURIComponent(input.range)}`;
  const result = await googleRequest<{ values?: unknown[][] }>(sheetUrl, credential);
  const rows = Array.isArray(result.values) ? normalizeRows(result.values) : [];
  const sync = await syncProjectWithGoogle(input.projectId, userId, {
    action: "import",
    spreadsheetId: input.documentId,
    range: input.range,
    rows,
    dryRun: false,
  });

  return {
    document,
    projectId: sync.projectId,
    range: sync.range,
    imported: sync.imported,
    rows,
  };
}
