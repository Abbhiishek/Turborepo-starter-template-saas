import { createAuth } from "@workspace/auth/server";
import { nextCookies } from "better-auth/next-js";

import { env as clientEnv } from "@/env/client";
import { env as serverEnv } from "@/env/server";

const trustedOrigins = [
  clientEnv.NEXT_PUBLIC_APP_URL,
  serverEnv.BETTER_AUTH_URL,
];

export const auth = createAuth({
  baseURL: serverEnv.BETTER_AUTH_URL,
  trustedOrigins,
  features: {
    admin: {
      adminRoles: ["admin"],
    },
    organization: {
      teams: {
        enabled: true,
      },
    },
    openAPI: serverEnv.AUTH_OPENAPI_ENABLED,
    plugins: [nextCookies()],
  },
});
