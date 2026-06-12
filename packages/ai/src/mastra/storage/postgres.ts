import { PostgresStore } from "@mastra/pg";

export type AiStorageEnv = {
  [key: string]: string | undefined;
  AI_DATABASE_URL?: string;
  DATABASE_URL?: string;
};

export function getAiStorageConnectionString(env: AiStorageEnv = process.env) {
  return env.AI_DATABASE_URL || env.DATABASE_URL;
}

export function createAiStorage(env: AiStorageEnv = process.env) {
  const connectionString = getAiStorageConnectionString(env);

  if (!connectionString) {
    return undefined;
  }

  return new PostgresStore({
    id: "ai-storage",
    connectionString,
  });
}
