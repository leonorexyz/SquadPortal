import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { accounts, googleIntegrations } from "@/db/schema";
import type { GoogleConnectInput } from "./integration-schema";

function toIso(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

function parseScopes(scope: string | null | undefined) {
  return scope ? scope.split(/[\s,]+/).filter(Boolean) : [];
}

export async function getGoogleConnection(userId: string) {
  const account = await db.select({
    id: accounts.id,
    accessTokenExpiresAt: accounts.accessTokenExpiresAt,
    createdAt: accounts.createdAt,
    scope: accounts.scope,
  }).from(accounts).where(and(eq(accounts.userId, userId), eq(accounts.providerId, "google"))).get();

  if (account) {
    return {
      provider: "google" as const,
      connected: true,
      accountId: account.id,
      connectedAt: toIso(account.createdAt),
      tokenExpiresAt: toIso(account.accessTokenExpiresAt),
      scopes: parseScopes(account.scope),
    };
  }

  const integration = await db.select({
    id: googleIntegrations.id,
    tokenExpiry: googleIntegrations.tokenExpiry,
    createdAt: googleIntegrations.createdAt,
  }).from(googleIntegrations).where(eq(googleIntegrations.userId, userId)).get();

  return {
    provider: "google" as const,
    connected: Boolean(integration),
    accountId: integration?.id ?? null,
    connectedAt: toIso(integration?.createdAt),
    tokenExpiresAt: toIso(integration?.tokenExpiry),
    scopes: [],
  };
}

export async function saveGoogleIntegration(userId: string, input: GoogleConnectInput) {
  if (!input.accessToken || !input.refreshToken) throw new Error("GOOGLE_TOKENS_REQUIRED");

  const now = new Date();
  const tokenExpiry = input.tokenExpiry ?? new Date(now.getTime() + 60 * 60 * 1000);
  const existing = await db.select({ id: googleIntegrations.id })
    .from(googleIntegrations)
    .where(eq(googleIntegrations.userId, userId))
    .get();

  if (existing) {
    await db.update(googleIntegrations).set({ accessToken: input.accessToken, refreshToken: input.refreshToken, tokenExpiry }).where(eq(googleIntegrations.id, existing.id)).run();
  } else {
    await db.insert(googleIntegrations).values({
      id: `google-${crypto.randomUUID()}`,
      userId,
      accessToken: input.accessToken,
      refreshToken: input.refreshToken,
      tokenExpiry,
      createdAt: now,
    }).run();
  }

  return getGoogleConnection(userId);
}

export async function disconnectGoogleIntegration(userId: string) {
  await db.delete(accounts).where(and(eq(accounts.userId, userId), eq(accounts.providerId, "google"))).run();
  await db.delete(googleIntegrations).where(eq(googleIntegrations.userId, userId)).run();

  return getGoogleConnection(userId);
}
