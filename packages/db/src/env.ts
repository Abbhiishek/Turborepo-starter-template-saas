import { createEnv } from "@t3-oss/env-core";
import { config } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as z from "zod";

config({
  path: resolve(dirname(fileURLToPath(import.meta.url)), "../.env"),
  quiet: true,
});

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url().optional(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});

export type DbEnv = typeof env;

export function getDatabaseUrl(runtimeEnv: Pick<DbEnv, "DATABASE_URL"> = env) {
  if (!runtimeEnv.DATABASE_URL) {
    throw new Error("DATABASE_URL is required in packages/db/.env.");
  }

  return runtimeEnv.DATABASE_URL;
}
