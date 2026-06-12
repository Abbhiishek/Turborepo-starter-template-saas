import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";

const healthInputSchema = z.object({
  source: z.string().default("manual"),
});

const healthOutputSchema = z.object({
  checkedAt: z.string(),
  source: z.string(),
  status: z.literal("ok"),
});

const collectAiHealth = createStep({
  id: "collect-ai-health",
  inputSchema: healthInputSchema,
  outputSchema: healthOutputSchema,
  execute: async ({ inputData }) => ({
    checkedAt: new Date().toISOString(),
    source: inputData.source,
    status: "ok" as const,
  }),
});

export const aiHealthWorkflow = createWorkflow({
  id: "ai-health-workflow",
  description: "Checks that the shared AI package can execute Mastra workflows.",
  inputSchema: healthInputSchema,
  outputSchema: healthOutputSchema,
})
  .then(collectAiHealth)
  .commit();
