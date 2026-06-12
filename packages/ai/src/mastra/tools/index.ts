import { systemTools } from "./system";
import { weatherTools } from "./weather";

export const tools = {
  ...systemTools,
  ...weatherTools,
} as const;
