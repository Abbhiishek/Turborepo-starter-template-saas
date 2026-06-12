import { Mastra } from "@mastra/core";
import { agents } from "./agents";
import { scorers } from "./scorers";
import { tools } from "./tools";
import { workflows } from "./workflows";

export const mastra = new Mastra({
  agents,
  scorers,
  tools,
  workflows,
});
