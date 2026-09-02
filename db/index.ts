import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { createClient } from "@libsql/client/node";
import { drizzle as drizzleLibsql } from "drizzle-orm/libsql/node";
import fs from "node:fs";
import path from "node:path";
import * as schema from "./schema";

const configuredDatabaseUrl = process.env.DATABASE_URL ?? "./data/squad-portal.db";
const isRemoteDatabase = /^(libsql|https|wss):\/\//.test(configuredDatabaseUrl);
let sqlite: Database.Database | null = null;
let db: any;

if (isRemoteDatabase) {
  const authToken = process.env.DATABASE_AUTH_TOKEN ?? process.env.TURSO_AUTH_TOKEN;
  if (!authToken) throw new Error("DATABASE_AUTH_TOKEN must be configured for a remote database.");

  const client = createClient({ url: configuredDatabaseUrl, authToken });
  // The application supports both sync local SQLite and async remote libSQL.
  // Consumers await database operations, which works for both drivers.
  db = drizzleLibsql({ client, schema });
} else {
  const databasePath = path.resolve(process.cwd(), configuredDatabaseUrl.replace(/^file:/, ""));
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });

  const localSqlite = new Database(databasePath);
  localSqlite.pragma("foreign_keys = ON");

  sqlite = localSqlite;
  db = drizzle(localSqlite, { schema });
}

export { db, sqlite };
