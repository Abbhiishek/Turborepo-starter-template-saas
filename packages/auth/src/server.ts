import { betterAuth, type BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, openAPI, organization } from "better-auth/plugins";

import { db } from "@workspace/db";

import { ac, roles } from "./access-control";
import {
  flagEnabled,
  getRuntimeEnv,
  parseCsv,
  type AuthRuntimeEnv,
} from "./env";

type AdminOptions = NonNullable<Parameters<typeof admin>[0]>;
type OrganizationOptions = NonNullable<Parameters<typeof organization>[0]>;

type BetterAuthPlugin = NonNullable<BetterAuthOptions["plugins"]>[number];

export type AuthFeatureFlags = {
  admin?: boolean | AdminOptions;
  organization?: boolean | OrganizationOptions;
  openAPI?: boolean;
  plugins?: BetterAuthPlugin[];
};

export type CreateAuthOptions = Omit<
  BetterAuthOptions,
  "database" | "plugins" | "secret" | "baseURL" | "trustedOrigins"
> & {
  env?: AuthRuntimeEnv;
  features?: AuthFeatureFlags;
  secret?: string;
  baseURL?: string;
  trustedOrigins?: string[];
};

function normalizeFeatureOptions<T extends object>(
  value: boolean | T | undefined,
): T | undefined {
  if (!value) {
    return undefined;
  }

  return value === true ? ({} as T) : value;
}

function withDefaultOrganizationAccessControl(
  options: OrganizationOptions,
): OrganizationOptions {
  return {
    ac,
    roles,
    ...options,
  };
}

export function getAuthFeaturesFromEnv(
  env: AuthRuntimeEnv = getRuntimeEnv(),
): AuthFeatureFlags {
  const adminRoles = parseCsv(env.AUTH_ADMIN_ROLES);
  const adminUserIds = parseCsv(env.AUTH_ADMIN_USER_IDS);
  const organizationTeamsEnabled =
    env.AUTH_ORGANIZATION_TEAMS_ENABLED === "true";

  return {
    admin: flagEnabled(env, "admin", "AUTH_ADMIN_ENABLED")
      ? {
          ...(adminRoles.length > 0 ? { adminRoles } : {}),
          ...(adminUserIds.length > 0 ? { adminUserIds } : {}),
        }
      : false,
    organization: flagEnabled(env, "organization", "AUTH_ORGANIZATION_ENABLED")
      ? {
          ...(organizationTeamsEnabled
            ? { teams: { enabled: organizationTeamsEnabled } }
            : {}),
        }
      : false,
    openAPI: flagEnabled(env, "open-api", "AUTH_OPENAPI_ENABLED"),
  };
}

export function createAuthPlugins(
  features: AuthFeatureFlags = {},
): BetterAuthPlugin[] {
  const plugins: BetterAuthPlugin[] = [];
  const adminOptions = normalizeFeatureOptions(features.admin);
  const organizationOptions = normalizeFeatureOptions(features.organization);

  if (organizationOptions) {
    plugins.push(
      organization(withDefaultOrganizationAccessControl(organizationOptions)),
    );
  }

  if (adminOptions) {
    plugins.push(admin(adminOptions));
  }

  if (features.openAPI) {
    plugins.push(openAPI());
  }

  plugins.push(...(features.plugins ?? []));

  return plugins;
}

export function createAuthOptions(
  options: CreateAuthOptions = {},
): BetterAuthOptions {
  const {
    baseURL,
    emailAndPassword,
    env: runtimeEnv,
    features,
    secret,
    session,
    socialProviders,
    trustedOrigins: optionTrustedOrigins,
    ...betterAuthOptions
  } = options;
  const env = runtimeEnv ?? getRuntimeEnv();
  const trustedOrigins = [
    ...parseCsv(env.BETTER_AUTH_TRUSTED_ORIGINS),
    ...parseCsv(env.AUTH_TRUSTED_ORIGINS),
    ...(optionTrustedOrigins ?? []),
  ];

  return {
    ...betterAuthOptions,
    database: drizzleAdapter(db, {
      provider: "pg",
    }),
    secret: secret ?? env.BETTER_AUTH_SECRET,
    baseURL: baseURL ?? env.BETTER_AUTH_URL,
    ...(trustedOrigins.length > 0 ? { trustedOrigins } : {}),
    emailAndPassword: {
      enabled: true,
      autoSignIn: true,
      revokeSessionsOnPasswordReset: true,
      ...(emailAndPassword ?? {}),
    },
    socialProviders: {
      ...(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET
        ? {
            github: {
              clientId: env.GITHUB_CLIENT_ID,
              clientSecret: env.GITHUB_CLIENT_SECRET,
            },
          }
        : {}),
      ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
        ? {
            google: {
              clientId: env.GOOGLE_CLIENT_ID,
              clientSecret: env.GOOGLE_CLIENT_SECRET,
            },
          }
        : {}),
      ...(socialProviders ?? {}),
    },
    session: {
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24,
      freshAge: 60 * 5,
      deferSessionRefresh: true,
      cookieCache: {
        enabled: true,
        maxAge: 60 * 5,
        strategy: "compact",
      },
      ...(session ?? {}),
    },
    plugins: createAuthPlugins(features ?? getAuthFeaturesFromEnv(env)),
  } satisfies BetterAuthOptions;
}

export function createAuth(options: CreateAuthOptions = {}) {
  return betterAuth(createAuthOptions(options));
}

export const auth = createAuth();
