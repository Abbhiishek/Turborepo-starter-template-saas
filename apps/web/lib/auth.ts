import { createAuth } from "@workspace/auth/server";
import { nextCookies } from "better-auth/next-js";

const trustedOrigins = [
  process.env.NEXT_PUBLIC_APP_URL,
  process.env.BETTER_AUTH_URL,
].filter((origin): origin is string => Boolean(origin));

export const auth = createAuth({
  baseURL: process.env.BETTER_AUTH_URL,
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
    openAPI: process.env.AUTH_OPENAPI_ENABLED === "true",
    plugins: [nextCookies()],
  },
});
