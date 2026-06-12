# @workspace/auth

Shared Better Auth package for the workspace.

This package owns the common auth foundation: the database adapter, runtime
environment parsing, shared session defaults, feature toggles, and reusable
organization access-control helpers. It does not force every app to use the same
auth surface. Each app should create its own small server/client auth modules
and opt into the features it actually needs.

## Design Goals

- Keep identity centralized while keeping app auth configuration local.
- Let each app choose its Better Auth plugins without affecting other apps.
- Keep organization roles scoped to Better Auth membership rows.
- Make organization permissions plug-and-play per app.
- Keep generated schema configuration explicit and reproducible.
- Provide safe defaults, but allow app overrides everywhere they matter.

## Mental Model

| Concern                                               | Owner                                       |
| ----------------------------------------------------- | ------------------------------------------- |
| User identity, sessions, accounts                     | Better Auth tables in `@workspace/db`       |
| Shared Drizzle adapter, env parsing, session defaults | `packages/auth`                             |
| App-specific server plugin list                       | `apps/<app>/lib/auth.ts`                    |
| App-specific client plugin list                       | `apps/<app>/lib/auth-client.ts`             |
| App-specific access control                           | `apps/<app>/lib/access-control.ts`          |
| App-specific inferred auth types                      | `apps/<app>/lib/auth-types.ts`              |
| Next.js route handler                                 | `apps/<app>/app/api/auth/[...all]/route.ts` |
| Schema-affecting plugin superset                      | `packages/auth/src/schema.ts`               |

`owner`, `admin`, and `member` are organization membership roles stored on the
Better Auth `member` table. Their permissions should be interpreted by the app
that is currently running. Do not create product-specific role names just to
change what `member` means in one app.

## Package Exports

### `@workspace/auth`

Root export for shared server helpers and default access-control helpers.

```ts
export {
  auth,
  createAuth,
  createAuthOptions,
  createAuthPlugins,
  getAuthFeaturesFromEnv,
} from "@workspace/auth";

export {
  ac,
  admin,
  createWorkspaceAccessControl,
  defaultAppRoleStatements,
  defaultAppStatement,
  defaultWorkspaceAccessControl,
  member,
  organizationStatement,
  owner,
  roles,
  statement,
} from "@workspace/auth";
```

Prefer importing from explicit subpaths in app code:

```ts
import { createAuth } from "@workspace/auth/server";
import { createWorkspaceAuthClient } from "@workspace/auth/client";
import { createWorkspaceAccessControl } from "@workspace/auth/access-control";
```

### `@workspace/auth/server`

Server-side Better Auth factory and default instance.

| Export                         | Purpose                                                                   |
| ------------------------------ | ------------------------------------------------------------------------- |
| `createAuth(options?)`         | Creates a Better Auth instance with shared defaults.                      |
| `createAuthOptions(options?)`  | Creates the Better Auth options object without constructing the instance. |
| `createAuthPlugins(features?)` | Converts feature flags into Better Auth plugins.                          |
| `getAuthFeaturesFromEnv(env?)` | Reads feature flags from env.                                             |
| `auth`                         | Default auth instance using runtime env feature flags.                    |
| `AuthFeatureFlags`             | Feature flag type.                                                        |
| `CreateAuthOptions`            | Factory options type.                                                     |

### `@workspace/auth/client`

Client-side Better Auth factory and default client.

| Export                                | Purpose                                                   |
| ------------------------------------- | --------------------------------------------------------- |
| `createWorkspaceAuthClient(options?)` | Creates a Better Auth React client with selected plugins. |
| `authClient`                          | Default client without optional plugins enabled.          |

### `@workspace/auth/access-control`

Organization access-control helpers.

| Export                                   | Purpose                                               |
| ---------------------------------------- | ----------------------------------------------------- |
| `createWorkspaceAccessControl(options?)` | Factory for app-specific organization access control. |
| `defaultWorkspaceAccessControl`          | Default access-control preset.                        |
| `ac`                                     | Default Better Auth access-control instance.          |
| `roles`                                  | Default role map.                                     |
| `owner`, `admin`, `member`               | Default role objects.                                 |
| `statement`                              | Default merged statement map.                         |
| `organizationStatement`                  | Better Auth's built-in organization statement map.    |
| `defaultAppStatement`                    | Workspace sample app resources.                       |
| `defaultAppRoleStatements`               | Workspace sample app role grants.                     |
| `CreateWorkspaceAccessControlOptions`    | Factory options type.                                 |
| `CreateWorkspaceRolesContext`            | Role factory callback context type.                   |
| `WorkspaceRoles`                         | Role map type.                                        |
| `WorkspaceRoleStatements`                | Role statement override type.                         |

### `@workspace/auth/next`

Exports `GET` and `POST` handlers for the default `auth` instance.

Use this only when an app intentionally wants the package-level default auth
instance. Most production apps should create their own route handler from their
local `auth`.

### `@workspace/auth/schema`

Better Auth schema-generation config. Used by:

```bash
pnpm --filter @workspace/auth auth:generate
pnpm --filter @workspace/auth auth:info
```

## Recommended App Layout

```txt
apps/
  web/
    app/api/auth/[...all]/route.ts
    lib/access-control.ts
    lib/auth.ts
    lib/auth-client.ts
    lib/auth-types.ts
```

Keep package-level defaults in `packages/auth`. Keep app decisions inside the
app.

## Quick Start: Plain App

Use this when an app only needs email/password, sessions, and env-configured
social providers.

```ts
// apps/plain/lib/auth.ts
import { createAuth } from "@workspace/auth/server";

export const auth = createAuth({
  baseURL: process.env.BETTER_AUTH_URL,
});
```

```ts
// apps/plain/app/api/auth/[...all]/route.ts
import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "@/lib/auth";

export const { GET, POST } = toNextJsHandler(auth);
```

```ts
// apps/plain/lib/auth-client.ts
import { createWorkspaceAuthClient } from "@workspace/auth/client";

export const authClient = createWorkspaceAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
});
```

## Quick Start: Organization App

Use this when an app needs organization membership, invitations, teams, and
permission checks.

```ts
// apps/b2b/lib/access-control.ts
import { createWorkspaceAccessControl } from "@workspace/auth/access-control";

export const b2bAccess = createWorkspaceAccessControl({
  statement: {
    project: ["create", "read", "update", "delete"],
    billing: ["read", "update"],
    auditLog: ["read"],
  },
  roleStatements: {
    owner: {
      project: ["create", "read", "update", "delete"],
      billing: ["read", "update"],
      auditLog: ["read"],
    },
    admin: {
      project: ["create", "read", "update", "delete"],
      billing: ["read"],
      auditLog: ["read"],
    },
    member: {
      project: ["read"],
    },
  },
});
```

```ts
// apps/b2b/lib/auth.ts
import { createAuth } from "@workspace/auth/server";
import { nextCookies } from "better-auth/next-js";

import { b2bAccess } from "./access-control";

export const auth = createAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: [process.env.NEXT_PUBLIC_APP_URL].filter(
    (origin): origin is string => Boolean(origin),
  ),
  features: {
    organization: {
      ac: b2bAccess.ac,
      roles: b2bAccess.roles,
      teams: {
        enabled: true,
      },
    },
    plugins: [nextCookies()],
  },
});
```

```ts
// apps/b2b/lib/auth-client.ts
import { createWorkspaceAuthClient } from "@workspace/auth/client";

import { b2bAccess } from "./access-control";

export const authClient = createWorkspaceAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
  features: {
    organization: {
      ac: b2bAccess.ac,
      roles: b2bAccess.roles,
      teams: {
        enabled: true,
      },
    },
  },
});
```

```ts
// apps/b2b/app/api/auth/[...all]/route.ts
import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "@/lib/auth";

export const { GET, POST } = toNextJsHandler(auth);
```

## Access Control

Better Auth requires two values for typed organization permissions:

- `ac`: the access-control instance created from a statement map.
- `roles`: a role map created from the same `ac`.

`createWorkspaceAccessControl` builds both values and keeps Better Auth's
built-in organization permissions in every role.

### Default Preset

Calling the factory with no options uses the default app preset:

```ts
import { createWorkspaceAccessControl } from "@workspace/auth/access-control";

export const access = createWorkspaceAccessControl();
```

The preset includes:

```ts
project: ["create", "read", "update", "delete"];
billing: ["read", "update"];
auditLog: ["read"];
```

Default app grants:

| Role     | Project                      | Billing      | Audit Log |
| -------- | ---------------------------- | ------------ | --------- |
| `owner`  | create, read, update, delete | read, update | read      |
| `admin`  | create, read, update, delete | read         | read      |
| `member` | read                         | none         | none      |

### App-Specific Resources

If an app passes `statement`, it owns all app-specific resources and role
grants. The default sample resources are not inherited.

```ts
export const supportAccess = createWorkspaceAccessControl({
  statement: {
    ticket: ["create", "read", "update", "close"],
    report: ["read"],
  },
  roleStatements: {
    owner: {
      ticket: ["create", "read", "update", "close"],
      report: ["read"],
    },
    admin: {
      ticket: ["create", "read", "update", "close"],
      report: ["read"],
    },
    member: {
      ticket: ["create", "read"],
    },
  },
});
```

### Additional Roles

Use the `roles` callback when an app needs roles beyond `owner`, `admin`, and
`member`.

```ts
export const docsAccess = createWorkspaceAccessControl({
  statement: {
    document: ["create", "read", "update", "delete", "publish"],
  },
  roleStatements: {
    owner: {
      document: ["create", "read", "update", "delete", "publish"],
    },
    admin: {
      document: ["create", "read", "update", "publish"],
    },
    member: {
      document: ["read"],
    },
  },
  roles: ({ ac, defaultRoles }) => ({
    ...defaultRoles,
    editor: ac.newRole({
      document: ["create", "read", "update"],
    }),
    viewer: ac.newRole({
      document: ["read"],
    }),
  }),
});
```

### Static Role Checks

Static checks answer whether a role definition contains a permission. They do
not validate the logged-in user's session or active organization.

```ts
import { b2bAccess } from "./access-control";

const canAdminReadAuditLog = b2bAccess.roles.admin.authorize({
  auditLog: ["read"],
}).success;
```

Use static checks for local UI decisions, not for authorization boundaries.

## Server API

### `createAuth(options?)`

Creates a Better Auth instance with these shared defaults:

- Drizzle adapter connected to `@workspace/db`.
- `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` from env unless overridden.
- Trusted origins from `BETTER_AUTH_TRUSTED_ORIGINS`, `AUTH_TRUSTED_ORIGINS`,
  and `trustedOrigins`.
- Email/password enabled with auto sign-in and password-reset session revoke.
- GitHub/Google providers when their env vars are present.
- Session defaults with compact cookie cache.
- Plugins from `features` or runtime env flags.

```ts
import { createAuth } from "@workspace/auth/server";

export const auth = createAuth({
  baseURL: "https://app.example.com",
  trustedOrigins: ["https://app.example.com"],
  emailAndPassword: {
    autoSignIn: false,
  },
});
```

### Feature Flags

```ts
export const auth = createAuth({
  features: {
    admin: true,
    organization: true,
    openAPI: true,
  },
});
```

Boolean feature flags enable the shared defaults. Object feature flags pass
options into the Better Auth plugin.

```ts
export const auth = createAuth({
  features: {
    admin: {
      adminRoles: ["admin", "support"],
    },
    organization: {
      teams: {
        enabled: true,
      },
      disableOrganizationDeletion: true,
    },
  },
});
```

### Custom Plugins

Use `features.plugins` for plugins that are not modeled by the common feature
flags.

```ts
import { username } from "better-auth/plugins";

export const auth = createAuth({
  features: {
    plugins: [
      username({
        minUsernameLength: 3,
      }),
    ],
  },
});
```

For Next.js apps, keep `nextCookies()` in the app and put it last.

```ts
import { nextCookies } from "better-auth/next-js";

export const auth = createAuth({
  features: {
    plugins: [nextCookies()],
  },
});
```

### Server Permission Checks

Use `auth.api.hasPermission` for server-side authorization. If
`organizationId` is omitted, Better Auth uses the active organization stored in
the session.

```ts
"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function createProject() {
  const result = await auth.api.hasPermission({
    headers: await headers(),
    body: {
      permissions: {
        project: ["create"],
      },
    },
  });

  if (!result.success) {
    throw new Error("You do not have permission to create projects.");
  }

  // Create the project.
}
```

For checks against a specific organization:

```ts
const result = await auth.api.hasPermission({
  headers: await headers(),
  body: {
    organizationId,
    permissions: {
      billing: ["update"],
    },
  },
});
```

### Session Checks

Protected server code should validate the session with Better Auth, not by
reading cookies directly.

```ts
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return <h1>Welcome {session.user.name}</h1>;
}
```

## Client API

### `createWorkspaceAuthClient(options?)`

Creates a Better Auth React client with selected client plugins.

```ts
import { createWorkspaceAuthClient } from "@workspace/auth/client";

export const authClient = createWorkspaceAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
});
```

### Organization Client

Client plugin selection should mirror the server plugin selection for that app.
If the server uses app-specific `ac` and `roles`, the client should use the same
values.

```ts
import { createWorkspaceAuthClient } from "@workspace/auth/client";

import { b2bAccess } from "./access-control";

export const authClient = createWorkspaceAuthClient({
  features: {
    organization: {
      ac: b2bAccess.ac,
      roles: b2bAccess.roles,
      teams: {
        enabled: true,
      },
    },
  },
});
```

### Client Permission Checks

Use the `hasPermission` endpoint when the decision must reflect the current
session, active organization, and stored member role.

```tsx
"use client";

import { authClient } from "@/lib/auth-client";

export async function canOpenBillingSettings() {
  const { data, error } = await authClient.organization.hasPermission({
    permissions: {
      billing: ["update"],
    },
  });

  if (error) {
    return false;
  }

  return data.success;
}
```

Use `checkRolePermission` for UI-only checks against a known role.

```tsx
const canAdminReadAuditLog = authClient.organization.checkRolePermission({
  role: "admin",
  permissions: {
    auditLog: ["read"],
  },
});
```

### Client Session Hook

```tsx
"use client";

import { authClient } from "@/lib/auth-client";

export function CurrentUser() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return <span>Loading...</span>;
  }

  return <span>{session?.user.name ?? "Signed out"}</span>;
}
```

## App Types

Create auth-derived types beside each app's local auth instance. This keeps B2B
organization/admin types separate from simpler apps.

```ts
// apps/b2b/lib/auth-types.ts
import type { auth } from "./auth";

export type Session = typeof auth.$Infer.Session;
export type User = Session["user"];
```

For client-side inferred organization models:

```ts
// apps/b2b/lib/auth-client-types.ts
import type { authClient } from "./auth-client";

export type ActiveOrganization = typeof authClient.$Infer.ActiveOrganization;
```

## Environment Variables

Auth env is scoped to `packages/auth/.env` for secrets, session defaults, auth
feature flags, and OAuth provider credentials. Database credentials belong in
`packages/db/.env`. App URLs and deployment/platform values belong in the
consuming app, such as `apps/web/.env`.

| Variable                                    | Purpose                                                     |
| ------------------------------------------- | ----------------------------------------------------------- |
| `BETTER_AUTH_SECRET`                        | Better Auth secret. Must be set in production.              |
| `AUTH_FEATURES`                             | Comma-separated feature list, such as `admin,organization`. |
| `AUTH_ADMIN_ENABLED`                        | Explicitly enable admin plugin when set to `true`.          |
| `AUTH_ADMIN_ROLES`                          | Comma-separated Better Auth admin roles.                    |
| `AUTH_ADMIN_USER_IDS`                       | Comma-separated admin user IDs.                             |
| `AUTH_ORGANIZATION_ENABLED`                 | Explicitly enable organization plugin when set to `true`.   |
| `AUTH_ORGANIZATION_TEAMS_ENABLED`           | Enable organization teams when set to `true`.               |
| `AUTH_OPENAPI_ENABLED`                      | Explicitly enable OpenAPI plugin when set to `true`.        |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | Optional GitHub OAuth credentials.                          |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Optional Google OAuth credentials.                          |

`AUTH_FEATURES` accepts both dashed and compact names. For example, `open-api`
and `openapi` both enable the OpenAPI feature.

```env
BETTER_AUTH_SECRET="replace-with-at-least-32-random-characters"
AUTH_FEATURES="admin,organization"
AUTH_ADMIN_ROLES="admin"
AUTH_ORGANIZATION_TEAMS_ENABLED="true"
```

Put app URLs beside the app that owns them:

```env
# apps/web/.env
NEXT_PUBLIC_APP_URL="http://localhost:3000"
BETTER_AUTH_URL="http://localhost:3000"
```

## Schema And Migrations

`packages/auth/src/schema.ts` is the Better Auth schema-generation entrypoint.
It should include every schema-affecting plugin that the monorepo needs.

Generate the Better Auth Drizzle schema:

```bash
pnpm --filter @workspace/auth auth:generate
```

Inspect Better Auth schema info:

```bash
pnpm --filter @workspace/auth auth:info
```

Then generate and apply database migrations from `@workspace/db`:

```bash
pnpm --filter @workspace/db db:generate
pnpm --filter @workspace/db db:migrate
```

Access-control statements and static roles do not add tables by themselves.
Dynamic access control can be schema-affecting, so add it to
`packages/auth/src/schema.ts` before generating schema if an app uses it.

## Common Patterns

### B2C App Without Organizations

```ts
import { createAuth } from "@workspace/auth/server";

export const auth = createAuth({
  baseURL: process.env.B2C_AUTH_URL,
  features: {
    organization: false,
    admin: false,
  },
});
```

### B2B App With Organizations And Admin

```ts
export const auth = createAuth({
  features: {
    admin: {
      adminRoles: ["admin", "support"],
    },
    organization: {
      ac: b2bAccess.ac,
      roles: b2bAccess.roles,
      teams: {
        enabled: true,
      },
    },
  },
});
```

### Internal API With OpenAPI

```ts
export const auth = createAuth({
  baseURL: process.env.INTERNAL_API_AUTH_URL,
  features: {
    admin: true,
    openAPI: true,
  },
});
```

### App With Passkeys Or External Plugins

Install the plugin package in the app workspace and pass the plugin through
`features.plugins`.

```bash
pnpm add @better-auth/passkey --filter web
```

```ts
import { passkey } from "@better-auth/passkey";

export const auth = createAuth({
  features: {
    plugins: [
      passkey({
        rpID: "app.example.com",
        rpName: "Example App",
      }),
    ],
  },
});
```

## Production Rules

- Create one local `auth.ts` per app.
- Create one local `auth-client.ts` per app.
- Keep server and client organization plugin options in sync.
- Define app-specific access control beside the app.
- Use `auth.api.hasPermission` for real authorization boundaries.
- Use `checkRolePermission` only for static UI decisions.
- Do not treat global app admins and organization admins as the same concept.
- Do not enable every plugin globally because one app needs it.
- Update `packages/auth/src/schema.ts` before generating schema for any
  schema-affecting plugin.
- Always set `BETTER_AUTH_SECRET` in the auth package environment and
  `BETTER_AUTH_URL` in the consuming app environment in production.
