import { getWeatherTool } from "./get-weather-tool";

export const weatherTools = {
  getWeatherTool,
} as const;

export { getDailyWeather, getWeatherTool } from "./get-weather-tool";
export type { DailyWeather, GetWeatherInput } from "./schemas";
