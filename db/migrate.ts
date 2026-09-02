import path from "node:path";
import { db, sqlite } from "./index";

async function migrateDatabase() {
  const migrationsFolder = path.resolve(process.cwd(), "drizzle");
  const isRemoteDatabase = /^(libsql|https|wss):\/\//.test(process.env.DATABASE_URL ?? "");

  if (isRemoteDatabase) {
    const { migrate } = await import("drizzle-orm/libsql/migrator");
    await migrate(db, { migrationsFolder });
    return;
  }

  const { migrate } = await import("drizzle-orm/better-sqlite3/migrator");
  migrate(db, { migrationsFolder });
  sqlite?.close();
}

migrateDatabase().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
