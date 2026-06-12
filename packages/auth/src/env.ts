export type AuthRuntimeEnv = {
  [key: string]: string | undefined;
  AUTH_ADMIN_ENABLED?: string;
  AUTH_ADMIN_ROLES?: string;
  AUTH_ADMIN_USER_IDS?: string;
  AUTH_FEATURES?: string;
  AUTH_OPENAPI_ENABLED?: string;
  AUTH_ORGANIZATION_ENABLED?: string;
  AUTH_ORGANIZATION_TEAMS_ENABLED?: string;
  AUTH_TRUSTED_ORIGINS?: string;
  BETTER_AUTH_SECRET?: string;
  BETTER_AUTH_TRUSTED_ORIGINS?: string;
  BETTER_AUTH_URL?: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  NODE_ENV?: string;
};

export function getRuntimeEnv(): AuthRuntimeEnv {
  if (typeof process === "undefined") {
    return {};
  }

  return process.env;
}

export function parseCsv(value: string | undefined): string[] {
  return (
    value
      ?.split(",")
      .map((item) => item.trim())
      .filter(Boolean) ?? []
  );
}

export function flagEnabled(
  env: AuthRuntimeEnv,
  featureName: string,
  explicitFlagName: keyof AuthRuntimeEnv,
) {
  const features = new Set(
    parseCsv(env.AUTH_FEATURES).map((feature) => feature.toLowerCase()),
  );

  return (
    env[explicitFlagName] === "true" ||
    features.has(featureName) ||
    features.has(featureName.replaceAll("-", ""))
  );
}
