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
    AZURE_OPENAI_RESOURCE_NAME: z.string().optional(),
    AZURE_OPENAI_API_KEY: z.string().min(1).optional(),
    AZURE_OPENAI_API_VERSION: z.string().min(1).optional(),
    AZURE_OPENAI_BASE_URL: z.string().url().optional(),
    AZURE_OPENAI_DEPLOYMENT_NAME: z.string().min(1).optional(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});

export type AiEnv = typeof env;
