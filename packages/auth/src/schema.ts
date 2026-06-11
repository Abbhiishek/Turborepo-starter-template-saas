import { createAuth } from "./server";

export const auth = createAuth({
  features: {
    admin: true,
    organization: {
      teams: {
        enabled: true,
      },
    },
    openAPI: true,
  },
});
