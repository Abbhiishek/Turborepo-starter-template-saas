# @workspace/ai

Shared AI package for this monorepo.

This package is the central place for Mastra-powered agents, tools, workflows,
memory, storage, models, scorers, datasets, and experiments. Apps should import
from this package instead of creating their own disconnected AI setup.

## What This Package Solves

When multiple apps need the same AI behavior, putting agents directly inside an
app becomes hard to maintain. You end up copying tools, prompts, memory logic,
model names, and evaluation code.

`@workspace/ai` gives the monorepo one shared AI layer:

- Models live in one place.
- Tools live in one place.
- Agents can reuse those models and tools.
- Memory can use shared Mastra storage.
- Workflows can orchestrate multi-step jobs.
- Scorers can judge output quality.
- Datasets store test cases.
- Experiments run agents/workflows against datasets and record scores.

The current example is a weather itinerary agent. It fetches weather for a
location and suggests a practical plan for the day.

## Commands

Run commands from the repo root:

```bash
corepack pnpm --filter @workspace/ai dev
corepack pnpm --filter @workspace/ai build
corepack pnpm --filter @workspace/ai check-types
corepack pnpm --filter @workspace/ai lint
```

What each command does:

- `dev`: starts Mastra development mode and Studio.
- `build`: builds the Mastra server bundle into `.mastra/`.
- `check-types`: runs TypeScript without emitting files.
- `lint`: runs ESLint for the package.

## Required Environment Variables

At minimum, the Azure provider needs an API key, resource name, and deployment
name.

```env
AZURE_OPENAI_RESOURCE_NAME="your-azure-openai-resource"
AZURE_OPENAI_API_KEY="your-api-key"
AZURE_OPENAI_GPT4O_DEPLOYMENT_NAME="your-gpt-4o-deployment"
AZURE_OPENAI_WEATHER_ITINERARY_DEPLOYMENT_NAME="your-weather-itinerary-deployment"
```

Storage is optional for local experimentation, but it is required for durable
memory, datasets, experiment results, and score history. Database credentials
used by `@workspace/ai` are owned by this package, so configure storage in
`packages/ai/.env`.

```env
DATABASE_URL="postgresql://user:password@localhost:5432/app"
AI_DATABASE_URL="postgresql://user:password@localhost:5432/app"
```

If `AI_DATABASE_URL` is not set, AI storage falls back to `DATABASE_URL` from
the same `packages/ai/.env` file.

## Should AI Storage Use The Same DB As The App?

Yes, it can use the same Postgres database. That is a normal setup.

Use the same database when:

- You want one DB to back the app, auth, and AI tables.
- You are okay with Mastra creating or using its own storage tables there.
- Your backups and environment management are simpler with one DB.

Use a separate `AI_DATABASE_URL` when:

- AI logs, traces, memory, datasets, and experiments may grow quickly.
- You want to isolate AI data from core product data.
- You want different retention or cleanup policies.
- You want to move AI workloads later without touching app tables.

No functional problem is expected if you use the same DB. The main concern is
operational: table ownership, migrations, backups, data retention, and growth.

## Folder Structure

```text
src/
  index.ts
  mastra/
    index.ts
    registry.ts

    models/
      azure.ts
      index.ts

    storage/
      postgres.ts
      index.ts

    memory/
      defaults.ts
      index.ts

    tools/
      index.ts
      system/
        ai-health-tool.ts
        index.ts
      weather/
        get-weather-tool.ts
        schemas.ts
        index.ts

    agents/
      index.ts
      system/
        index.ts
      weather/
        weather-itinerary-agent.ts
        index.ts

    workflows/
      index.ts
      system/
        ai-health-workflow.ts
        index.ts

    scorers/
      weather-itinerary-quality-scorer.ts
      index.ts

    evals/
      datasets/
        weather-itinerary-dataset.ts
        index.ts
      experiments/
        weather-itinerary-experiment.ts
        index.ts
      index.ts
```

The package is organized by resource type, then by domain.

For example, the weather domain has:

- `tools/weather/*`
- `agents/weather/*`
- `scorers/weather-*`
- `evals/datasets/weather-*`
- `evals/experiments/weather-*`

This scales better than one giant folder with 50 to 60 agents in it.

## Mental Model

Think of the AI package as a small operating system for AI features.

### Models

Models are the LLM and embedding deployments. They are created with the AI SDK.

Example:

```ts
export const AZURE_GPT4O = azure(
  process.env.AZURE_OPENAI_GPT4O_DEPLOYMENT_NAME!,
);
```

Apps and agents should import named models from `@workspace/ai/models`.

### Tools

Tools are functions an agent can call.

The weather tool calls Open-Meteo APIs and returns structured weather data. The
agent does not need to know how geocoding or forecast URLs work. It only knows
that a tool named `get-weather` can return weather for a location.

### Agents

Agents combine:

- instructions
- model
- tools
- optional memory
- optional live scorers

The weather itinerary agent uses:

- `AZURE_WEATHER_ITINERARY` as its model
- `getWeatherTool` as its weather lookup tool
- shared conversation memory when storage is configured
- `weatherItineraryQualityScorer` to score live outputs

### Memory

Memory lets an agent remember previous conversation context.

This package exposes:

```ts
createConversationMemory()
```

That helper uses Mastra storage if a DB connection string exists. If storage is
not configured, it returns `undefined`, and agents still work without memory.

### Storage

Storage is the persistence layer. In this package it is Postgres via
`@mastra/pg`.

Storage is used by:

- agent memory
- scorer results
- eval datasets
- experiment runs
- Mastra runtime persistence

### Workflows

Workflows are for deterministic multi-step jobs. Use workflows when the process
has steps that should run in order, branch, retry, or be reused outside chat.

Agents are better for conversational reasoning. Workflows are better for
repeatable pipelines.

### Scorers

Scorers judge an output and return a score. Scores are usually between `0` and
`1`.

This package has:

```ts
weatherItineraryQualityScorer
```

It checks whether an itinerary includes:

- morning plan
- afternoon plan
- evening plan
- weather-aware guidance
- clothing or packing advice
- transport guidance
- backup plan

The scorer is registered in Mastra and attached to the weather agent.

### Datasets

Datasets are stored test cases. Each item usually has:

- `input`: what you send to an agent, workflow, or scorer
- `groundTruth`: what you expect or want to compare against

This package has a starter dataset:

```ts
weatherItineraryDatasetItems
```

It contains weather itinerary prompts for Mumbai, New York City, and London.

### Experiments

Experiments run a dataset against a target and score the result.

Target examples:

- an agent
- a workflow
- a scorer

This package has:

```ts
runWeatherItineraryExperiment()
```

It seeds the weather itinerary dataset and starts an experiment against the
`weather-itinerary-agent`.

### Editor And Studio

`@mastra/editor` is installed so this package can use Mastra editor capabilities
as the AI workspace grows. Mastra Studio is started through:

```bash
corepack pnpm --filter @workspace/ai dev
```

Use Studio to inspect and run registered Mastra resources during development.

### Observability

`@mastra/observability` is installed so this package can add richer tracing and
monitoring as the app grows.

The baseline package already stores AI runtime data through Mastra storage when
`AI_DATABASE_URL` or `DATABASE_URL` is configured in `packages/ai/.env`. Add
explicit observability configuration later when you decide which backend should
receive traces.

## How A Weather Request Flows

```mermaid
flowchart TD
  A["App imports weatherItineraryAgent or mastra"] --> B["Weather Itinerary Agent"]
  B --> C["AZURE_WEATHER_ITINERARY model"]
  B --> D["getWeatherTool"]
  D --> E["Open-Meteo geocoding API"]
  D --> F["Open-Meteo forecast API"]
  B --> G["Conversation memory"]
  G --> H["Postgres storage"]
  B --> I["weatherItineraryQualityScorer"]
  I --> H
```

Step by step:

1. An app calls the weather agent.
2. The agent reads its instructions.
3. The agent uses the Azure model for reasoning.
4. The agent calls `getWeatherTool` to fetch weather.
5. The tool returns structured forecast data.
6. The agent writes a day plan.
7. Memory can persist conversation context if storage is configured.
8. The scorer checks the answer quality.
9. Mastra can store score results and runtime data.

## Package Exports

Use these imports from apps:

```ts
import { mastra } from "@workspace/ai";
import { AZURE_GPT4O } from "@workspace/ai/models";
import { agents } from "@workspace/ai/agents";
import { tools } from "@workspace/ai/tools";
import { workflows } from "@workspace/ai/workflows";
import { scorers } from "@workspace/ai/scorers";
import {
  runWeatherItineraryExperiment,
  seedWeatherItineraryDataset,
} from "@workspace/ai/evals";
import { weatherItineraryDatasetItems } from "@workspace/ai/evals/datasets";
```

Use `mastra` when you want the full registered Mastra instance:

```ts
import { mastra } from "@workspace/ai";

const agent = mastra.getAgent("weatherItineraryAgent");
```

Use direct imports when you are wiring a specific app feature or test:

```ts
import { weatherItineraryQualityScorer } from "@workspace/ai/scorers";
```

## Models Guide

The project uses your preferred provider-file pattern.

Provider files should directly export models:

```ts
import { createAzure } from "@ai-sdk/azure";

export const azure = createAzure({
  resourceName: process.env.AZURE_OPENAI_RESOURCE_NAME || undefined,
  apiKey: process.env.AZURE_OPENAI_API_KEY || undefined,
});

export const AZURE_GPT4O = azure(
  process.env.AZURE_OPENAI_GPT4O_DEPLOYMENT_NAME!,
);
```

Provider model constants should be prefixed by provider:

```ts
export const AZURE_GPT4O = azure("gpt-4o-deployment");
export const AZURE_GPT5 = azure("gpt-5-deployment");
export const AZURE_TEXT_EMBEDDING = azure.textEmbedding(
  "text-embedding-3-small",
);
```

Feature-tuned models can use feature names:

```ts
export const AZURE_RESUME_REVIEW = azure(
  process.env.AZURE_OPENAI_RESUME_REVIEW_DEPLOYMENT_NAME!,
);

export const AZURE_CODE_REVIEWER = azure(
  process.env.AZURE_OPENAI_CODE_REVIEWER_DEPLOYMENT_NAME!,
);
```

The important rule is consistency:

- The provider file owns provider configuration.
- The model export name tells the rest of the repo what the model is for.
- Agents import model constants, not raw environment variables.

### Custom Provider URLs

Some providers use OpenAI-compatible URLs or custom gateways. Keep that setup in
the provider file.

For Azure, the current file already leaves placeholders for:

```ts
// apiVersion: process.env.AZURE_OPENAI_API_VERSION || undefined,
// baseURL: process.env.AZURE_OPENAI_BASE_URL || undefined,
// headers: parseJsonRecord(process.env.AZURE_OPENAI_HEADERS),
// useDeploymentBasedUrls:
//   process.env.AZURE_OPENAI_USE_DEPLOYMENT_BASED_URLS === "true",
```

When you add a new provider, add one file:

```text
models/
  azure.ts
  openai-compatible.ts
  index.ts
```

Then export it from `models/index.ts`.

## Tools Guide

A tool is a typed function an agent can call.

The weather tool has:

- input schema
- output schema
- execute function

The file is:

```text
src/mastra/tools/weather/get-weather-tool.ts
```

The schema file is:

```text
src/mastra/tools/weather/schemas.ts
```

Why schemas matter:

- They validate inputs.
- They document the tool for the agent.
- They make tool outputs predictable for downstream code.

To add a new tool:

1. Create a domain folder under `tools/`.
2. Add a schema file.
3. Add the tool file.
4. Export it from the domain `index.ts`.
5. Add it to `tools/index.ts`.
6. Attach it to the agent that needs it.

Example shape:

```ts
export const myTool = createTool({
  id: "my-tool",
  description: "What the tool does.",
  inputSchema,
  outputSchema,
  execute: async (input) => {
    return result;
  },
});
```

## Agents Guide

An agent is where the model, prompt, tools, memory, and scorers come together.

The weather agent lives here:

```text
src/mastra/agents/weather/weather-itinerary-agent.ts
```

It uses:

```ts
model: AZURE_WEATHER_ITINERARY
tools: weatherTools
memory: createConversationMemory()
scorers: weatherItineraryQualityScorer
```

To add a new agent:

1. Choose a domain folder, for example `agents/support/`.
2. Create `support-triage-agent.ts`.
3. Import the model from `models`.
4. Import tools from `tools`.
5. Add memory only if the agent needs conversation history.
6. Add scorers if you want live quality checks.
7. Export the agent from the domain `index.ts`.
8. Register the domain in `agents/index.ts`.

Keep each agent focused. If one prompt starts doing five unrelated jobs, split
it into multiple agents or a workflow.

## Memory Guide

Memory is created here:

```text
src/mastra/memory/defaults.ts
```

The helper:

```ts
createConversationMemory()
```

does this:

1. Calls `createAiStorage()`.
2. If storage exists, returns a Mastra `Memory` instance.
3. If storage does not exist, returns `undefined`.

That design lets local dev continue even before a database is configured.

Use memory for:

- chat agents
- assistant agents
- agents that need user preferences
- agents that need previous conversation context

Avoid memory for:

- one-shot classification
- deterministic scoring
- batch jobs where every input must be independent

## Scoring Guide

Scoring answers the question: "Was this output good?"

The scorer file is:

```text
src/mastra/scorers/weather-itinerary-quality-scorer.ts
```

It uses `createScorer` and has three parts:

1. `preprocess`: extract signals from the output.
2. `generateScore`: convert signals into a numeric score.
3. `generateReason`: explain why the score was given.

Custom scorers use `@mastra/core/evals`. The `@mastra/evals` package is also
installed so the package can adopt Mastra eval utilities and prebuilt evaluators
as the evaluation layer grows.

Current score signals:

- Does it include morning?
- Does it include afternoon?
- Does it include evening?
- Does it mention weather?
- Does it mention clothing?
- Does it mention transport?
- Does it include a backup plan?

The scorer is registered here:

```text
src/mastra/scorers/index.ts
src/mastra/registry.ts
```

The weather agent also attaches it as a live scorer:

```ts
scorers: {
  weatherItineraryQuality: {
    scorer: weatherItineraryQualityScorer,
    sampling: {
      type: "ratio",
      rate: 1,
    },
  },
}
```

`rate: 1` means score every run. In production, you may lower that to sample a
smaller percentage of traffic.

## Datasets Guide

Datasets are reusable evaluation cases.

The weather dataset file is:

```text
src/mastra/evals/datasets/weather-itinerary-dataset.ts
```

It exports:

```ts
weatherItineraryDatasetName
weatherItineraryDatasetInputSchema
weatherItineraryDatasetGroundTruthSchema
weatherItineraryDatasetItems
getOrCreateWeatherItineraryDataset()
seedWeatherItineraryDataset()
```

The starter dataset contains prompts like:

```ts
{
  input:
    "Plan a practical day in Mumbai for someone who likes food, walking, and museums.",
  groundTruth: {
    location: "Mumbai",
    weatherConcern: "rain or heat",
    mustMention: ["morning", "afternoon", "evening", "backup"],
  },
}
```

Use datasets when:

- you want repeatable test cases
- you want to compare models
- you want to test prompt changes
- you want to prove one agent version is better than another

Datasets require Mastra storage. Without storage, there is nowhere to persist
the dataset items and experiment results.

## Experiments Guide

Experiments run a dataset through a target.

The weather experiment file is:

```text
src/mastra/evals/experiments/weather-itinerary-experiment.ts
```

It exports:

```ts
weatherItineraryExperimentConfig
runWeatherItineraryExperiment()
```

The current experiment:

- uses dataset `weather-itinerary-cases`
- targets agent `weather-itinerary-agent`
- scores with `weatherItineraryQualityScorer`
- runs with `maxConcurrency: 2`

Example usage:

```ts
import { mastra, runWeatherItineraryExperiment } from "@workspace/ai";

const result = await runWeatherItineraryExperiment(mastra.datasets);
console.log(result);
```

Use experiments before changing prompts or models:

1. Save current score as a baseline.
2. Change the prompt or model.
3. Run the same experiment again.
4. Compare scores and reasons.
5. Keep the change only if quality improves or the tradeoff is intentional.

## How To Add A New Eval

For a new domain, add three things.

### 1. Add a scorer

```text
src/mastra/scorers/code-review-quality-scorer.ts
```

Then export it:

```ts
export const scorers = {
  weatherItineraryQualityScorer,
  codeReviewQualityScorer,
} as const;
```

### 2. Add a dataset

```text
src/mastra/evals/datasets/code-review-dataset.ts
```

Add input and ground truth examples.

### 3. Add an experiment

```text
src/mastra/evals/experiments/code-review-experiment.ts
```

Point it at:

- target type: `agent`
- target id: your agent id
- scorers: your registered scorer key

## How To Add A New Agent Domain

Example: adding a future resume domain.

```text
agents/
  resume/
    resume-review-agent.ts
    resume-audit-agent.ts
    index.ts

tools/
  resume/
    parse-resume-tool.ts
    score-resume-tool.ts
    schemas.ts
    index.ts

scorers/
  resume-review-quality-scorer.ts

evals/
  datasets/
    resume-review-dataset.ts
  experiments/
    resume-review-experiment.ts
```

Then wire the domain into:

```text
agents/index.ts
tools/index.ts
scorers/index.ts
```

The root Mastra registry does not need to know every file. It only imports the
combined registries.

## Registry Pattern

The root registry is:

```text
src/mastra/registry.ts
```

It combines:

```ts
agents
scorers
tools
workflows
```

The Mastra instance is:

```text
src/mastra/index.ts
```

That file:

1. Creates storage if a DB URL exists.
2. Creates one shared Mastra instance.
3. Registers agents, tools, workflows, and scorers.

Apps should usually import:

```ts
import { mastra } from "@workspace/ai";
```

## Naming Rules

Use stable IDs because logs, datasets, and experiments will refer to them.

Recommended patterns:

- Agent id: `weather-itinerary-agent`
- Tool id: `get-weather`
- Scorer id: `weather-itinerary-quality`
- Dataset name: `weather-itinerary-cases`
- Experiment name: `weather-itinerary-baseline`
- Model export: `AZURE_WEATHER_ITINERARY`

For provider model constants:

```text
PROVIDER_FEATURE_OR_MODEL
```

Examples:

```ts
AZURE_GPT4O
AZURE_GPT5
AZURE_TEXT_EMBEDDING
AZURE_RESUME_REVIEW
AZURE_CODE_REVIEWER
```

## Working With 50 To 60 Agents

Do not put every agent in one file.

Use domain folders:

```text
agents/
  weather/
  support/
  billing/
  resume/
  code-review/
  research/
```

Each domain folder should have:

- one `index.ts`
- one file per agent
- small local helpers only if needed

Do the same for tools, datasets, and experiments.

Good rule:

- If a file is only useful for one domain, keep it in that domain.
- If multiple domains use it, move it to a shared folder.
- If it needs to be imported by apps, export it through the package exports.

## Testing And Verification

Before opening a PR, run:

```bash
corepack pnpm --filter @workspace/ai check-types
corepack pnpm --filter @workspace/ai lint
corepack pnpm --filter @workspace/ai build
```

For prompt or model changes, also run the matching experiment.

Example:

```ts
import { mastra, runWeatherItineraryExperiment } from "@workspace/ai";

await runWeatherItineraryExperiment(mastra.datasets);
```

## Troubleshooting

### The agent fails because the model is undefined

Check these variables:

```env
AZURE_OPENAI_RESOURCE_NAME
AZURE_OPENAI_API_KEY
AZURE_OPENAI_GPT4O_DEPLOYMENT_NAME
AZURE_OPENAI_WEATHER_ITINERARY_DEPLOYMENT_NAME
```

### Memory is not working

Check that one of these exists in `packages/ai/.env`:

```env
AI_DATABASE_URL
DATABASE_URL
```

If neither exists, `createConversationMemory()` returns `undefined`.

### Datasets or experiments do not persist

Datasets and experiments require storage. Add `AI_DATABASE_URL` or
`DATABASE_URL` to `packages/ai/.env`.

### The weather tool cannot find a city

The weather tool uses Open-Meteo geocoding. Try a more specific location:

```text
Mumbai, India
New York City, USA
London, United Kingdom
```

### Scores are too strict or too weak

Edit:

```text
src/mastra/scorers/weather-itinerary-quality-scorer.ts
```

Adjust the signals or scoring weights. Then run the experiment again.

## Useful Mastra Docs

- [Manual install](https://mastra.ai/docs/getting-started/manual-install)
- [Evals overview](https://mastra.ai/docs/evals/overview)
- [Custom scorers](https://mastra.ai/docs/evals/custom-scorers)
- [Datasets overview](https://mastra.ai/docs/evals/datasets/overview)
- [Running experiments](https://mastra.ai/docs/evals/datasets/running-experiments)
