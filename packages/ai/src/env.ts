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
    AI_DATABASE_URL: z.string().optional(),
    AZURE_OPENAI_API_KEY: z.string().min(1).optional(),
    AZURE_OPENAI_API_VERSION: z.string().min(1).optional(),
    AZURE_OPENAI_BASE_URL: z.string().url().optional(),
    AZURE_OPENAI_GPT4O_DEPLOYMENT_NAME: z.string().min(1).default("gpt-4o"),
    AZURE_OPENAI_GPT5_DEPLOYMENT_NAME: z.string().min(1).optional(),
    AZURE_OPENAI_HEADERS: z.string().min(1).optional(),
    AZURE_OPENAI_OPUS_4_5_DEPLOYMENT_NAME: z.string().min(1).optional(),
    AZURE_OPENAI_RESOURCE_NAME: z.string().min(1).optional(),
    AZURE_OPENAI_TEXT_EMBEDDING_DEPLOYMENT_NAME: z
      .string()
      .min(1)
      .default("text-embedding-3-small"),
    AZURE_OPENAI_USE_DEPLOYMENT_BASED_URLS: z.stringbool().default(false),
    AZURE_OPENAI_WEATHER_ITINERARY_DEPLOYMENT_NAME: z
      .string()
      .min(1)
      .optional(),
    DATABASE_URL: z.string().optional(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});

export type AiEnv = typeof env;
