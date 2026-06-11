import { createAuthClient } from "better-auth/react";
import { adminClient, organizationClient } from "better-auth/client/plugins";

type AuthClientOptions = NonNullable<Parameters<typeof createAuthClient>[0]>;
type AuthClientPlugin = NonNullable<AuthClientOptions["plugins"]>[number];

export type AuthClientFeatureFlags = {
  admin?: boolean;
  organization?: boolean;
  plugins?: AuthClientPlugin[];
};

export type CreateAuthClientOptions = Omit<AuthClientOptions, "plugins"> & {
  features?: AuthClientFeatureFlags;
};

export function createWorkspaceAuthClient(
  options: CreateAuthClientOptions = {},
) {
  const { features = {}, ...clientOptions } = options;
  const plugins: AuthClientPlugin[] = [];

  if (features.organization) {
    plugins.push(organizationClient());
  }

  if (features.admin) {
    plugins.push(adminClient());
  }

  plugins.push(...(features.plugins ?? []));

  return createAuthClient({
    ...clientOptions,
    plugins,
  });
}

export const authClient = createWorkspaceAuthClient();
