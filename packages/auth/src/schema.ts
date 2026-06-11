import { ac, roles } from "./access-control";
import { createAuth } from "./server";

export const auth = createAuth({
  features: {
    admin: true,
    organization: {
      ac,
      roles,
      teams: {
        enabled: true,
      },
    },
    openAPI: true,
  },
});
