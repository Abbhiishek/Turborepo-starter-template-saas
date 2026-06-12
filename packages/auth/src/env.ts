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
    AUTH_ADMIN_ENABLED: z.stringbool().optional(),
    AUTH_ADMIN_ROLES: z.string().optional(),
    AUTH_ADMIN_USER_IDS: z.string().optional(),
    AUTH_FEATURES: z.string().optional(),
    AUTH_OPENAPI_ENABLED: z.stringbool().optional(),
    AUTH_ORGANIZATION_ENABLED: z.stringbool().optional(),
    AUTH_ORGANIZATION_TEAMS_ENABLED: z.stringbool().default(false),
    AUTH_TRUSTED_ORIGINS: z.string().optional(),
    BETTER_AUTH_SECRET: z.string().min(32).optional(),
    BETTER_AUTH_TRUSTED_ORIGINS: z.string().optional(),
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

export function getBetterAuthSecret(
  runtimeEnv: AuthRuntimeEnv = getRuntimeEnv(),
) {
  return runtimeEnv.BETTER_AUTH_SECRET;
}

export function parseCsv(value: string | undefined): string[] {
  return (
    value
      ?.split(",")
      .map((item) => item.trim())
      .filter(Boolean) ?? []
  );
}

export function flagEnabled(
  env: AuthRuntimeEnv,
  featureName: string,
  explicitFlagName:
    | "AUTH_ADMIN_ENABLED"
    | "AUTH_OPENAPI_ENABLED"
    | "AUTH_ORGANIZATION_ENABLED",
) {
  const features = new Set(
    parseCsv(env.AUTH_FEATURES).map((feature) => feature.toLowerCase()),
  );

  return (
    env[explicitFlagName] === true ||
    features.has(featureName) ||
    features.has(featureName.replaceAll("-", ""))
  );
}
