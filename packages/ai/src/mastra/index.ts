import { Mastra } from "@mastra/core";

import { mastraRegistry } from "./registry";
import { createAiStorage } from "./storage";

const storage = createAiStorage();

export const mastra = new Mastra({
  ...mastraRegistry,
  ...(storage ? { storage } : {}),
});
