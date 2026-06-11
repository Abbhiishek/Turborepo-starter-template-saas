# @workspace/auth

Shared Better Auth configuration for apps and servers in this monorepo.

This package is intentionally a factory, not a single mandatory auth instance.
Each app should create its own small `auth.ts`, `auth-client.ts`, and optional
`auth-types.ts` files by calling the shared helpers from this package.

That gives every app its own plugin surface:

- A B2B app can enable `organization`, `admin`, GitHub login, and org hooks.
- A B2C app can stay simple with email/password, username, Google One Tap, or passkeys.
- An internal API can expose OpenAPI/admin endpoints without forcing those plugins into public apps.

## What is already supported?

Yes, the current package supports pluggable auth per app.

The built-in `features` object covers the common plugins we want often:

```ts
features: {
  admin: true,
  organization: true,
  openAPI: true,
}
```

For everything else, pass Better Auth plugins directly through `features.plugins`.
For app-specific Better Auth options, pass them directly to `createAuth`. The
factory keeps the shared Drizzle adapter, env defaults, and session defaults,
then merges your app-specific options.

```ts
import { createAuth } from "@workspace/auth/server";
import { username } from "better-auth/plugins";

export const auth = createAuth({
  features: {
    plugins: [username()],
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => ({
          data: {
            ...user,
            name: user.name.trim(),
          },
        }),
      },
    },
  },
});
```

## Recommended App Layout

Use this pattern inside each app:

```txt
apps/
  b2b/
    app/api/auth/[...all]/route.ts
    lib/auth.ts
    lib/auth-client.ts
    lib/auth-types.ts
  b2c/
    app/api/auth/[...all]/route.ts
    lib/auth.ts
    lib/auth-client.ts
    lib/auth-types.ts
```

The shared package stays in `packages/auth`. App-specific plugin choices stay
inside the app.

## Server Comparison

### Plain App

Use this for an app that only needs email/password, sessions, and any shared
social providers configured by env.

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

### B2B App With Organization, Admin, GitHub, And Hooks

Use this when an app needs organization membership, team support, admin APIs,
account linking via social providers, and app-specific database hooks.

```ts
// apps/b2b/lib/auth.ts
import { createAuth } from "@workspace/auth/server";
import { username } from "better-auth/plugins";

export const auth = createAuth({
  baseURL: process.env.B2B_AUTH_URL,
  trustedOrigins: ["https://b2b.example.com"],
  features: {
    admin: {
      adminRoles: ["admin", "support"],
    },
    organization: {
      teams: {
        enabled: true,
      },
    },
    plugins: [
      username({
        minUsernameLength: 3,
      }),
    ],
  },
  socialProviders: {
    github: {
      clientId: process.env.B2B_GITHUB_CLIENT_ID!,
      clientSecret: process.env.B2B_GITHUB_CLIENT_SECRET!,
      mapProfileToUser: (profile) => ({
        name: profile.name ?? profile.login,
      }),
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          // Create app-specific profile, audit row, CRM sync, etc.
          console.log("B2B user created", user.id);
        },
      },
    },
  },
});
```

### B2C App With Username, Passkey, One Tap, And No Organization

Use this when an app is public-facing and should not expose organization/admin
endpoints.

```ts
// apps/b2c/lib/auth.ts
import { passkey } from "@better-auth/passkey";
import { createAuth } from "@workspace/auth/server";
import { oneTap, username } from "better-auth/plugins";

export const auth = createAuth({
  baseURL: process.env.B2C_AUTH_URL,
  features: {
    plugins: [
      username(),
      oneTap(),
      passkey({
        rpID: "b2c.example.com",
        rpName: "B2C App",
      }),
    ],
  },
  socialProviders: {
    google: {
      clientId: process.env.B2C_GOOGLE_CLIENT_ID!,
      clientSecret: process.env.B2C_GOOGLE_CLIENT_SECRET!,
    },
  },
});
```

Install plugin packages that are not part of `better-auth` itself:

```bash
pnpm add @better-auth/passkey --filter b2c
```

### Internal API With OpenAPI And Admin Only

Use this for an internal server that needs auth endpoints for tools or
automation, but no organization client surface.

```ts
// apps/internal-api/lib/auth.ts
import { createAuth } from "@workspace/auth/server";

export const auth = createAuth({
  baseURL: process.env.INTERNAL_API_AUTH_URL,
  features: {
    admin: true,
    openAPI: true,
  },
});
```

## Next.js Cookie Support

For Next.js apps, you can pass `nextCookies()` as an app-specific plugin. Keep
it in the app because non-Next servers should not depend on Next cookies.

```ts
// apps/web/lib/auth.ts
import { createAuth } from "@workspace/auth/server";
import { nextCookies } from "better-auth/next-js";

export const auth = createAuth({
  features: {
    plugins: [
      // Better Auth recommends this as the last plugin in a Next.js app.
      nextCookies(),
    ],
  },
});
```

For protected Next.js pages/routes, prefer full server validation:

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

Cookie-only checks are useful for optimistic redirects, but they are not a
security boundary. Protected actions should still call `auth.api.getSession`.

## Client Comparison

Client plugin selection should match the server plugin selection for that app.

### Plain Client

```ts
// apps/plain/lib/auth-client.ts
import { createWorkspaceAuthClient } from "@workspace/auth/client";

export const authClient = createWorkspaceAuthClient({
  baseURL: process.env.NEXT_PUBLIC_PLAIN_AUTH_URL,
});
```

### B2B Client With Organization, Admin, And Username

```ts
// apps/b2b/lib/auth-client.ts
import { createWorkspaceAuthClient } from "@workspace/auth/client";
import { usernameClient } from "better-auth/client/plugins";

export const authClient = createWorkspaceAuthClient({
  baseURL: process.env.NEXT_PUBLIC_B2B_AUTH_URL,
  features: {
    organization: true,
    admin: true,
    plugins: [usernameClient()],
  },
});
```

### B2C Client With Username, Passkey, And One Tap

```ts
// apps/b2c/lib/auth-client.ts
import { passkeyClient } from "@better-auth/passkey/client";
import { createWorkspaceAuthClient } from "@workspace/auth/client";
import { oneTapClient, usernameClient } from "better-auth/client/plugins";

export const authClient = createWorkspaceAuthClient({
  baseURL: process.env.NEXT_PUBLIC_B2C_AUTH_URL,
  features: {
    plugins: [
      usernameClient(),
      passkeyClient(),
      oneTapClient({
        clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        autoSelect: false,
        cancelOnTapOutside: true,
      }),
    ],
  },
});
```

## Types

If an app needs auth-derived types, create `auth-types.ts` beside that app's
`auth.ts`. This keeps B2B organization/admin types separate from simpler apps.

```ts
// apps/b2b/lib/auth-types.ts
import type { auth } from "./auth";

export type Session = typeof auth.$Infer.Session;
export type User = Session["user"];
```

For a client component:

```tsx
"use client";

import { authClient } from "@/lib/auth-client";

export function CurrentUser() {
  const { data: session } = authClient.useSession();

  return <span>{session?.user.name}</span>;
}
```

## Schema And Migrations

`pnpm --filter @workspace/auth auth:generate` generates the Better Auth Drizzle
schema into `packages/db/src/schema/auth.ts`.

Important: the generated schema must include every plugin that needs database
tables or columns. The current schema config enables admin and organization/team
support. If an app adds a schema-affecting plugin such as username or passkey,
also add that plugin to `packages/auth/src/schema.ts`, regenerate the schema,
and generate a Drizzle migration.

```bash
pnpm --filter @workspace/auth auth:generate
pnpm --filter @workspace/db db:generate
pnpm --filter @workspace/db db:migrate
```

## Mental Model

| Concern                                               | Put It In                                   |
| ----------------------------------------------------- | ------------------------------------------- |
| Shared Drizzle adapter, session defaults, env parsing | `packages/auth`                             |
| App-specific server plugin list                       | `apps/<app>/lib/auth.ts`                    |
| App-specific client plugin list                       | `apps/<app>/lib/auth-client.ts`             |
| App-specific inferred auth types                      | `apps/<app>/lib/auth-types.ts`              |
| Next route handler                                    | `apps/<app>/app/api/auth/[...all]/route.ts` |
| Schema-affecting plugin superset                      | `packages/auth/src/schema.ts`               |

Do not enable every plugin globally just because one app needs it. Enable only
the server and client plugins that each app actually consumes.
