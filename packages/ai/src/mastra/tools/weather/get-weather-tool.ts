import { createTool } from "@mastra/core/tools";

import {
  dailyWeatherSchema,
  getWeatherInputSchema,
  type DailyWeather,
  type GetWeatherInput,
} from "./schemas";

type GeocodingResponse = {
  results?: Array<{
    name: string;
    country?: string;
    admin1?: string;
    latitude: number;
    longitude: number;
    timezone?: string;
  }>;
};

type ForecastResponse = {
  daily?: {
    time?: string[];
    weather_code?: number[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    precipitation_probability_max?: number[];
    wind_speed_10m_max?: number[];
    sunrise?: string[];
    sunset?: string[];
  };
};

export const getWeatherTool = createTool({
  id: "get-weather",
  description:
    "Fetch daily weather for a location using Open-Meteo and return itinerary-ready conditions.",
  inputSchema: getWeatherInputSchema,
  outputSchema: dailyWeatherSchema,
  execute: async (input) => getDailyWeather(input),
});

export async function getDailyWeather(
  input: GetWeatherInput,
): Promise<DailyWeather> {
  const place = await geocodeLocation(input.location);
  const forecastUrl = new URL("https://api.open-meteo.com/v1/forecast");

  forecastUrl.searchParams.set("latitude", String(place.latitude));
  forecastUrl.searchParams.set("longitude", String(place.longitude));
  forecastUrl.searchParams.set(
    "daily",
    [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "precipitation_probability_max",
      "wind_speed_10m_max",
      "sunrise",
      "sunset",
    ].join(","),
  );
  forecastUrl.searchParams.set("forecast_days", "7");
  forecastUrl.searchParams.set("timezone", place.timezone || "auto");

  const response = await fetch(forecastUrl);

  if (!response.ok) {
    throw new Error(`Weather lookup failed: ${response.status}`);
  }

  const forecast = (await response.json()) as ForecastResponse;
  const dayIndex = getForecastDayIndex(forecast, input.date);
  const daily = forecast.daily;

  if (!daily) {
    throw new Error("Weather lookup returned no daily forecast data.");
  }

  const condition = mapWeatherCode(daily.weather_code?.[dayIndex]);
  const temperatureMaxC = daily.temperature_2m_max?.[dayIndex] ?? 0;
  const temperatureMinC = daily.temperature_2m_min?.[dayIndex] ?? 0;
  const precipitationProbabilityMax =
    daily.precipitation_probability_max?.[dayIndex] ?? 0;
  const windSpeedMaxKph = daily.wind_speed_10m_max?.[dayIndex] ?? 0;

  return {
    location: formatPlace(place),
    date: daily.time?.[dayIndex] ?? new Date().toISOString().slice(0, 10),
    latitude: place.latitude,
    longitude: place.longitude,
    condition,
    temperatureMaxC,
    temperatureMinC,
    precipitationProbabilityMax,
    windSpeedMaxKph,
    sunrise: daily.sunrise?.[dayIndex],
    sunset: daily.sunset?.[dayIndex],
    summary: buildWeatherSummary({
      condition,
      temperatureMaxC,
      temperatureMinC,
      precipitationProbabilityMax,
      windSpeedMaxKph,
    }),
  };
}

async function geocodeLocation(location: string) {
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", location);
  url.searchParams.set("count", "1");
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Location lookup failed: ${response.status}`);
  }

  const data = (await response.json()) as GeocodingResponse;
  const place = data.results?.[0];

  if (!place) {
    throw new Error(`No location found for "${location}".`);
  }

  return place;
}

function getForecastDayIndex(forecast: ForecastResponse, date?: string) {
  if (!date) {
    return 0;
  }

  const index = forecast.daily?.time?.findIndex((day) => day === date) ?? -1;

  return index >= 0 ? index : 0;
}

function mapWeatherCode(code: number | undefined): DailyWeather["condition"] {
  if (code === undefined) {
    return "unknown";
  }

  if (code === 0) {
    return "clear";
  }

  if ([1, 2, 3].includes(code)) {
    return "cloudy";
  }

  if ([45, 48].includes(code)) {
    return "fog";
  }

  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    return "rain";
  }

  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) {
    return "snow";
  }

  if (code >= 95) {
    return "storm";
  }

  return "unknown";
}

function buildWeatherSummary(
  weather: Pick<
    DailyWeather,
    | "condition"
    | "precipitationProbabilityMax"
    | "temperatureMaxC"
    | "temperatureMinC"
    | "windSpeedMaxKph"
  >,
) {
  return `${weather.condition} day, ${weather.temperatureMinC}-${weather.temperatureMaxC}C, ${weather.precipitationProbabilityMax}% rain chance, wind up to ${weather.windSpeedMaxKph} kph.`;
}

function formatPlace(place: Awaited<ReturnType<typeof geocodeLocation>>) {
  return [place.name, place.admin1, place.country].filter(Boolean).join(", ");
}
