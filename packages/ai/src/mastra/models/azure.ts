import "dotenv/config";
import { createAzure } from "@ai-sdk/azure";

export const azure = createAzure({
  resourceName: process.env.AZURE_OPENAI_RESOURCE_NAME || undefined,
  apiKey: process.env.AZURE_OPENAI_API_KEY || undefined,
  // apiVersion: process.env.AZURE_OPENAI_API_VERSION || undefined,
  // baseURL: process.env.AZURE_OPENAI_BASE_URL || undefined,
  // headers: parseJsonRecord(process.env.AZURE_OPENAI_HEADERS),
  // useDeploymentBasedUrls:
  //   process.env.AZURE_OPENAI_USE_DEPLOYMENT_BASED_URLS === "true",
});

export const AZURE_GPT4O = azure(
  process.env.AZURE_OPENAI_GPT4O_DEPLOYMENT_NAME!,
);

export const AZURE_WEATHER_ITINERARY = azure(
  process.env.AZURE_OPENAI_WEATHER_ITINERARY_DEPLOYMENT_NAME ||
    process.env.AZURE_OPENAI_GPT4O_DEPLOYMENT_NAME!,
);

export const BASEMODEL = AZURE_GPT4O;
