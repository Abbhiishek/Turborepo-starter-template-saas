import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { env } from "./env";

// Export all drizzle helpers and generated table schemas.
export * from "drizzle-orm";

function shouldUseDatabaseSsl(databaseUrl?: string) {
  if (!databaseUrl) {
    return false;
  }

  const url = new URL(databaseUrl);
  const sslMode = url.searchParams.get("sslmode");

  if (
    sslMode === "require" ||
    sslMode === "verify-ca" ||
    sslMode === "verify-full"
  ) {
    return true;
  }

  if (sslMode === "disable" || sslMode === "allow" || sslMode === "prefer") {
    return false;
  }

  return !new Set([
    "localhost",
    "127.0.0.1",
    "::1",
    "postgres",
    "host.docker.internal",
  ]).has(url.hostname);
}

const pool = new Pool({
  ...(env.DATABASE_URL ? { connectionString: env.DATABASE_URL } : {}),
  ssl: shouldUseDatabaseSsl(env.DATABASE_URL),
  max: 20,
  min: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

export const db = drizzle(pool);
