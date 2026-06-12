import { createAzure } from "@ai-sdk/azure";

import { env } from "../../env";

export const azure = createAzure({
  resourceName: env.AZURE_OPENAI_RESOURCE_NAME,
  apiKey: env.AZURE_OPENAI_API_KEY,
  apiVersion: env.AZURE_OPENAI_API_VERSION,
  baseURL: env.AZURE_OPENAI_BASE_URL,
  useDeploymentBasedUrls: env.AZURE_OPENAI_USE_DEPLOYMENT_BASED_URLS,
});

export const AZURE_GPT4O = azure(env.AZURE_OPENAI_GPT4O_DEPLOYMENT_NAME);

export const AZURE_WEATHER_ITINERARY = azure(
  env.AZURE_OPENAI_WEATHER_ITINERARY_DEPLOYMENT_NAME ??
    env.AZURE_OPENAI_GPT4O_DEPLOYMENT_NAME,
);

export const BASEMODEL = AZURE_GPT4O;
