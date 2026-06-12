import { Memory } from "@mastra/memory";

import { createAiStorage } from "../storage";

export const defaultMemoryOptions = {
  lastMessages: 20,
} as const;

export function createConversationMemory() {
  const storage = createAiStorage();

  if (!storage) {
    return undefined;
  }

  return new Memory({
    storage,
    options: defaultMemoryOptions,
  });
}
