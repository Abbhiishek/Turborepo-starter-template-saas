import {
  seedWeatherItineraryDataset,
  type DatasetsClient,
} from "../datasets";

export const weatherItineraryExperimentConfig = {
  name: "weather-itinerary-baseline",
  targetType: "agent",
  targetId: "weather-itinerary-agent",
  scorers: ["weatherItineraryQualityScorer"],
  maxConcurrency: 2,
} as const;

export async function runWeatherItineraryExperiment(
  datasets: DatasetsClient,
) {
  const dataset = await seedWeatherItineraryDataset(datasets);

  return dataset.startExperiment(weatherItineraryExperimentConfig);
}
