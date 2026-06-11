import { createWorkspaceAuthClient } from "@workspace/auth/client";

export const authClient = createWorkspaceAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
  features: {
    admin: true,
    organization: true,
  },
});
