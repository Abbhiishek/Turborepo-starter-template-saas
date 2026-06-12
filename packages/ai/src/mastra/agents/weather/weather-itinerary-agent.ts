import { Agent } from "@mastra/core/agent";

import { createConversationMemory } from "../../memory";
import { AZURE_WEATHER_ITINERARY } from "../../models";
import { weatherItineraryQualityScorer } from "../../scorers";
import { weatherTools } from "../../tools/weather";

const memory = createConversationMemory();

export const weatherItineraryAgent = new Agent({
  id: "weather-itinerary-agent",
  name: "Weather Itinerary Agent",
  instructions: `
You plan a practical one-day itinerary from the user's location and weather.

Always call getWeatherTool before suggesting plans. Use the forecast to adapt:
- Rain or storm: prioritize indoor activities, short transfers, and backup options.
- Clear or cloudy: include outdoor blocks and hydration/sun protection where useful.
- Wind, snow, fog, or heat: adjust travel time and safety guidance.

Return a concise day plan with morning, afternoon, evening, clothing, transport, and backup notes.
`,
  model: AZURE_WEATHER_ITINERARY,
  ...(memory ? { memory } : {}),
  scorers: {
    weatherItineraryQuality: {
      scorer: weatherItineraryQualityScorer,
      sampling: {
        type: "ratio",
        rate: 1,
      },
    },
  },
  tools: weatherTools,
});
