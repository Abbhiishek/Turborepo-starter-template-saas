import { createWorkspaceAuthClient } from "@workspace/auth/client";

import { env } from "@/env/client";

export const authClient = createWorkspaceAuthClient({
  baseURL: env.NEXT_PUBLIC_APP_URL,
  features: {
    admin: true,
    organization: {

    },
  },
});
