import { z } from "zod";

export const weatherItineraryDatasetName = "weather-itinerary-cases";

export const weatherItineraryDatasetInputSchema = z
  .string()
  .describe("Prompt passed to the weather itinerary agent.");

export const weatherItineraryDatasetGroundTruthSchema = z.object({
  location: z.string(),
  weatherConcern: z.string(),
  mustMention: z.array(z.string()),
});

export const weatherItineraryDatasetItems = [
  {
    input:
      "Plan a practical day in Mumbai for someone who likes food, walking, and museums.",
    groundTruth: {
      location: "Mumbai",
      weatherConcern: "rain or heat",
      mustMention: ["morning", "afternoon", "evening", "backup"],
    },
  },
  {
    input:
      "Create a one-day outdoor-friendly itinerary for New York City tomorrow.",
    groundTruth: {
      location: "New York City",
      weatherConcern: "temperature, rain, and wind",
      mustMention: ["weather", "transport", "clothing", "backup"],
    },
  },
  {
    input:
      "I am in London and want a low-stress day plan with cafes and short walks.",
    groundTruth: {
      location: "London",
      weatherConcern: "rain and cloudy weather",
      mustMention: ["indoor", "walking", "umbrella", "evening"],
    },
  },
] as const;

export type WeatherItineraryDatasetItem =
  (typeof weatherItineraryDatasetItems)[number];

export type WeatherItineraryDatasetGroundTruth = z.infer<
  typeof weatherItineraryDatasetGroundTruthSchema
>;

export type DatasetRecord = {
  id: string;
  name?: string;
};

export type DatasetClient = {
  addItems(args: {
    items: Array<{
      input: string;
      groundTruth: WeatherItineraryDatasetGroundTruth;
    }>;
  }): Promise<unknown>;
  startExperiment(args: unknown): Promise<unknown>;
};

export type DatasetsClient = {
  create(args: {
    name: string;
    description?: string;
    inputSchema?: typeof weatherItineraryDatasetInputSchema;
    groundTruthSchema?: typeof weatherItineraryDatasetGroundTruthSchema;
  }): Promise<DatasetClient>;
  get(args: { id: string }): Promise<DatasetClient>;
  list(): Promise<{ datasets: DatasetRecord[] }>;
};

export async function getOrCreateWeatherItineraryDataset(
  datasets: DatasetsClient,
) {
  const { datasets: existingDatasets } = await datasets.list();
  const existingDataset = existingDatasets.find(
    (dataset) => dataset.name === weatherItineraryDatasetName,
  );

  if (existingDataset) {
    return datasets.get({ id: existingDataset.id });
  }

  return datasets.create({
    name: weatherItineraryDatasetName,
    description:
      "Golden test cases for the weather itinerary agent. Each input should produce a practical weather-aware day plan.",
    inputSchema: weatherItineraryDatasetInputSchema,
    groundTruthSchema: weatherItineraryDatasetGroundTruthSchema,
  });
}

export async function seedWeatherItineraryDataset(datasets: DatasetsClient) {
  const dataset = await getOrCreateWeatherItineraryDataset(datasets);

  await dataset.addItems({
    items: weatherItineraryDatasetItems.map((item) => ({
      input: item.input,
      groundTruth: {
        location: item.groundTruth.location,
        weatherConcern: item.groundTruth.weatherConcern,
        mustMention: [...item.groundTruth.mustMention],
      },
    })),
  });

  return dataset;
}
