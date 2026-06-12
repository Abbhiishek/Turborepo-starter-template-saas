import { createScorer } from "@mastra/core/evals";

type WeatherItinerarySignals = {
  hasMorningPlan: boolean;
  hasAfternoonPlan: boolean;
  hasEveningPlan: boolean;
  mentionsWeather: boolean;
  mentionsClothing: boolean;
  mentionsTransport: boolean;
  mentionsBackupPlan: boolean;
  wordCount: number;
};

export const weatherItineraryQualityScorer = createScorer({
  id: "weather-itinerary-quality",
  description:
    "Scores whether a weather itinerary is structured, weather-aware, and actionable.",
})
  .preprocess(({ run }) => extractWeatherItinerarySignals(run.output))
  .generateScore(({ results }) => {
    const signals = results.preprocessStepResult as WeatherItinerarySignals;
    const checks = [
      signals.hasMorningPlan,
      signals.hasAfternoonPlan,
      signals.hasEveningPlan,
      signals.mentionsWeather,
      signals.mentionsClothing,
      signals.mentionsTransport,
      signals.mentionsBackupPlan,
    ];

    const completionScore =
      checks.filter((check) => check).length / checks.length;
    const lengthPenalty =
      signals.wordCount < 80 ? 0.15 : signals.wordCount > 500 ? 0.1 : 0;

    return clampScore(completionScore - lengthPenalty);
  })
  .generateReason(({ results, score }) => {
    const signals = results.preprocessStepResult as WeatherItinerarySignals;
    const missing: string[] = [];

    if (!signals.hasMorningPlan) missing.push("morning plan");
    if (!signals.hasAfternoonPlan) missing.push("afternoon plan");
    if (!signals.hasEveningPlan) missing.push("evening plan");
    if (!signals.mentionsWeather) missing.push("weather-aware guidance");
    if (!signals.mentionsClothing) missing.push("clothing or packing advice");
    if (!signals.mentionsTransport) missing.push("transport guidance");
    if (!signals.mentionsBackupPlan) missing.push("backup plan");

    if (missing.length === 0) {
      return `Score ${score}: itinerary covers all expected day-planning signals.`;
    }

    return `Score ${score}: missing ${missing.join(", ")}.`;
  });

function extractWeatherItinerarySignals(output: unknown): WeatherItinerarySignals {
  const text = stringifyOutput(output).toLowerCase();

  return {
    hasMorningPlan: /\bmorning\b/.test(text),
    hasAfternoonPlan: /\bafternoon\b/.test(text),
    hasEveningPlan: /\bevening\b/.test(text),
    mentionsWeather:
      /\b(weather|rain|storm|sun|sunny|cloud|cloudy|wind|snow|temperature|heat|cold|fog)\b/.test(
        text,
      ),
    mentionsClothing:
      /\b(wear|clothing|clothes|jacket|umbrella|shoes|sunscreen|layers|pack)\b/.test(
        text,
      ),
    mentionsTransport:
      /\b(walk|drive|taxi|cab|bus|train|metro|transport|transit|ride|commute)\b/.test(
        text,
      ),
    mentionsBackupPlan: /\b(backup|alternative|indoor|indoors|plan b)\b/.test(
      text,
    ),
    wordCount: text.split(/\s+/).filter(Boolean).length,
  };
}

function stringifyOutput(output: unknown) {
  if (typeof output === "string") {
    return output;
  }

  if (
    output &&
    typeof output === "object" &&
    "text" in output &&
    typeof output.text === "string"
  ) {
    return output.text;
  }

  return JSON.stringify(output ?? "");
}

function clampScore(score: number) {
  return Math.max(0, Math.min(1, Number(score.toFixed(2))));
}
