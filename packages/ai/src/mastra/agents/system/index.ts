import { Agent } from "@mastra/core/agent";

import { AZURE_GPT4O } from "../../models";

export const testAgent = new Agent({
  id: "test-agent",
  name: "Test Agent",
  instructions: "You are a helpful assistant.",
  model: AZURE_GPT4O,
});

export const systemAgents = {
  testAgent,
} as const;
