import { systemAgents } from "./system";
import { weatherAgents } from "./weather";

export const agents = {
  ...systemAgents,
  ...weatherAgents,
} as const;
