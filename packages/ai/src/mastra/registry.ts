import { agents } from "./agents";
import { scorers } from "./scorers";
import { tools } from "./tools";
import { workflows } from "./workflows";

export const mastraRegistry = {
  agents,
  scorers,
  tools,
  workflows,
} as const;
