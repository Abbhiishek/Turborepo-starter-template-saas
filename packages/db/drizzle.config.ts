import { defineConfig } from "drizzle-kit";

import { getDatabaseUrl } from "./src/env";

export default defineConfig({
  out: "./src/migrations",
  schema: "./src/schema/**/*.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: getDatabaseUrl(),
  },
  casing: "snake_case",
  schemaFilter: "postgres",
  strict: true,
  verbose: true,
  migrations: {
    prefix: "timestamp",
    table: "__drizzle_migrations__",
    schema: "postgres",
  },
});
