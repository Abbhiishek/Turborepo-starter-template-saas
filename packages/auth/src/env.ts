import { createEnv } from "@t3-oss/env-core";
import { config } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as z from "zod";

config({
  path: resolve(dirname(fileURLToPath(import.meta.url)), "../.env"),
  quiet: true,
});

const optionalSecret = z.string().min(1).optional();

export const env = createEnv({
  server: {
    BETTER_AUTH_SECRET: z.string().min(32).optional(),
    GITHUB_CLIENT_ID: optionalSecret,
    GITHUB_CLIENT_SECRET: optionalSecret,
    GOOGLE_CLIENT_ID: optionalSecret,
    GOOGLE_CLIENT_SECRET: optionalSecret,
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});

export type AuthRuntimeEnv = typeof env;

export function getRuntimeEnv(): AuthRuntimeEnv {
  return env;
}

export function getBetterAuthSecret(runtimeEnv: AuthRuntimeEnv = getRuntimeEnv()) {
  return runtimeEnv.BETTER_AUTH_SECRET;
}

