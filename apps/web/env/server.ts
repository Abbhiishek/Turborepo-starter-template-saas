import { createEnv } from "@t3-oss/env-nextjs";
import * as z from "zod";

export const env = createEnv({
  server: {
    AUTH_OPENAPI_ENABLED: z.stringbool().default(false),
    BETTER_AUTH_URL: z.string().url().default("http://localhost:3000"),
  },
  runtimeEnv: {
    AUTH_OPENAPI_ENABLED: process.env.AUTH_OPENAPI_ENABLED,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
  },
  emptyStringAsUndefined: true,
});
