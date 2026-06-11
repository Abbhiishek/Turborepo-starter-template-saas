import { createAuthClient } from "better-auth/react";
import { adminClient, organizationClient } from "better-auth/client/plugins";

import { ac, roles } from "./access-control";

type AuthClientOptions = NonNullable<Parameters<typeof createAuthClient>[0]>;
type AuthClientPlugin = NonNullable<AuthClientOptions["plugins"]>[number];
type OrganizationClientOptions = NonNullable<
  Parameters<typeof organizationClient>[0]
>;

export type AuthClientFeatureFlags = {
  admin?: boolean;
  organization?: boolean | OrganizationClientOptions;
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
  const organizationOptions =
    features.organization === true ? {} : features.organization;

  if (organizationOptions) {
    plugins.push(
      organizationClient({
        ac,
        roles,
        ...organizationOptions,
      }),
    );
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
