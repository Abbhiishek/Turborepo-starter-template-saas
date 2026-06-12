import { z } from "zod";

export const weatherConditionSchema = z.enum([
  "clear",
  "cloudy",
  "fog",
  "rain",
  "snow",
  "storm",
  "unknown",
]);

export const getWeatherInputSchema = z.object({
  location: z.string().min(2).describe("City or place name."),
  date: z
    .string()
    .optional()
    .describe("Optional ISO date. Defaults to today's local forecast."),
});

export const dailyWeatherSchema = z.object({
  location: z.string(),
  date: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  condition: weatherConditionSchema,
  temperatureMaxC: z.number(),
  temperatureMinC: z.number(),
  precipitationProbabilityMax: z.number(),
  windSpeedMaxKph: z.number(),
  sunrise: z.string().optional(),
  sunset: z.string().optional(),
  summary: z.string(),
});

export type GetWeatherInput = z.input<typeof getWeatherInputSchema>;
export type DailyWeather = z.infer<typeof dailyWeatherSchema>;
