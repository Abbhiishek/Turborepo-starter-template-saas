import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const aiHealthTool = createTool({
  id: "ai-health",
  description: "Returns health metadata for the shared AI package.",
  inputSchema: z.object({
    includeTimestamp: z
      .boolean()
      .optional()
      .describe("Include the current ISO timestamp in the response."),
  }),
  outputSchema: z.object({
    packageName: z.literal("@workspace/ai"),
    status: z.literal("ok"),
    timestamp: z.string().optional(),
  }),
  execute: async ({ includeTimestamp = false }) => ({
    packageName: "@workspace/ai" as const,
    status: "ok" as const,
    ...(includeTimestamp ? { timestamp: new Date().toISOString() } : {}),
  }),
});
