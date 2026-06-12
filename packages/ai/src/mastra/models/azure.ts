import { createAzure } from "@ai-sdk/azure";

import { env } from "../../env";

export const azure = createAzure({
  resourceName: env.AZURE_OPENAI_RESOURCE_NAME,
  apiKey: env.AZURE_OPENAI_API_KEY,
});

const baseDeploymentName =
  env.AZURE_OPENAI_DEPLOYMENT_NAME ?? env.AZURE_OPENAI_GPT4O_DEPLOYMENT_NAME;

export const AZURE_GPT4O = azure(baseDeploymentName);

export const AZURE_WEATHER_ITINERARY = azure(
  env.AZURE_OPENAI_WEATHER_ITINERARY_DEPLOYMENT_NAME ?? baseDeploymentName,
);

export const BASEMODEL = AZURE_GPT4O;
