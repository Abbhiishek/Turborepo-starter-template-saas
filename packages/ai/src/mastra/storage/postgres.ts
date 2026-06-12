import { PostgresStore } from "@mastra/pg";

import { env, type AiEnv } from "../../env";

export type AiStorageEnv = Pick<AiEnv, "AI_DATABASE_URL" | "DATABASE_URL">;

export function getAiStorageConnectionString(runtimeEnv: AiStorageEnv = env) {
  return runtimeEnv.AI_DATABASE_URL ?? runtimeEnv.DATABASE_URL;
}

export function createAiStorage(runtimeEnv: AiStorageEnv = env) {
  const connectionString = getAiStorageConnectionString(runtimeEnv);

  if (!connectionString) {
    return undefined;
  }

  return new PostgresStore({
    id: "ai-storage",
    connectionString,
  });
}
