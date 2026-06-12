# Project Stack Template

A monorepo starter for products built on a shared, opinionated stack. Clone this template when starting a new project and extend it with app-specific packages (database, auth, API routes, etc.) as needed.

## Stack

| Layer      | Tool                                         | Role                                          |
| ---------- | -------------------------------------------- | --------------------------------------------- |
| Monorepo   | [Turborepo](https://turbo.build)             | Task orchestration, caching, and CI pipelines |
| Language   | [TypeScript](https://www.typescriptlang.org) | End-to-end type safety                        |
| Env        | [T3 Env](https://env.t3.gg)                  | Type-safe app/package environment contracts   |
| Validation | [Zod](https://zod.dev)                       | Runtime schemas and input validation          |
| ORM        | [Drizzle](https://orm.drizzle.team)          | Type-safe database access and migrations      |
| Auth       | [Better Auth](https://www.better-auth.com)   | Authentication and session management         |
| AI         | [Mastra](https://mastra.ai)                  | Shared agents, tools, workflows, and memory   |
| Styling    | [Tailwind CSS v4](https://tailwindcss.com)   | Utility-first CSS                             |
| Components | [shadcn/ui](https://ui.shadcn.com)           | Accessible, composable UI primitives          |

Drizzle and Better Auth are part of the intended stack for products built from this template. Add them to your app or a shared `packages/` workspace when you wire up persistence and auth.

## Project structure

```
project-stack-template/
├── apps/
│   └── web/                  # Next.js application
├── packages/
│   ├── ui/                   # Shared shadcn/ui components and global styles
│   ├── eslint-config/        # Shared ESLint configs
│   └── typescript-config/    # Shared TypeScript configs
├── package.json              # Root scripts and tooling
├── pnpm-workspace.yaml       # Workspace layout and dependency catalog
└── turbo.json                # Turborepo task pipeline
```

### Shared packages

- **`@workspace/ui`** — shadcn/ui components, Tailwind globals, and utilities. Import via `@workspace/ui/components/*` and `@workspace/ui/lib/*`.
- **`@workspace/ai`** — shared Mastra package for agents, tools, workflows, storage, and memory helpers.
- **`@workspace/auth`** — Better Auth server/client configuration with per-app feature flags for admin, organization/team support, OpenAPI, and extra plugins.
- **`@workspace/db`** — Drizzle Postgres client plus generated Better Auth schema. Auth tables live in `packages/db/src/schema/auth.ts`.
- **`@workspace/eslint-config`** — ESLint presets for Next.js and React libraries.
- **`@workspace/typescript-config`** — Base and framework-specific `tsconfig` presets.

## Prerequisites

- [Node.js](https://nodejs.org) >= 18
- [pnpm](https://pnpm.io) 9.x (see `packageManager` in root `package.json`)

## Quickstart

Follow these layers in order. Each layer builds on the previous one.

### Layer 1 — Run the project locally

```bash
# Install dependencies
pnpm install

# Start all dev servers (via Turborepo)
pnpm dev
```

The web app runs from `apps/web`. Open the URL printed in the terminal (typically `http://localhost:3000`).

Environment files are intentionally scoped to the app or package that owns the
values. Do not create a root `.env` or root `.env.example`.

| Owner           | Example file                 | Values kept there                                     |
| --------------- | ---------------------------- | ----------------------------------------------------- |
| `apps/web`      | `apps/web/.env.example`      | App URLs and deployment/platform-specific values      |
| `packages/db`   | `packages/db/.env.example`   | Database credentials used by the shared DB package    |
| `packages/ai`   | `packages/ai/.env.example`   | AI provider keys, model names, and AI storage DB URLs |
| `packages/auth` | `packages/auth/.env.example` | Auth secrets, sessions, flags, and provider secrets   |

Each runtime app or package defines its own T3 Env schema next to its source:

| Owner           | Env module                 | Scope                                        |
| --------------- | -------------------------- | -------------------------------------------- |
| `apps/web`      | `apps/web/env/client.ts`   | Public `NEXT_PUBLIC_*` values for the client |
| `apps/web`      | `apps/web/env/server.ts`   | Web-app server values such as auth URLs      |
| `packages/auth` | `packages/auth/src/env.ts` | Auth secrets, flags, origins, OAuth secrets  |
| `packages/db`   | `packages/db/src/env.ts`   | Database URLs used by the shared DB package  |
| `packages/ai`   | `packages/ai/src/env.ts`   | AI provider keys, model names, storage URLs  |

Do not read `process.env` directly from application code, and do not import
another workspace's env module. Import only the local env module for the current
app or package. If a package needs a value, define that variable in that
package's own env schema, even if another package uses a variable with the same
name.

Other root scripts:

| Command            | Description                     |
| ------------------ | ------------------------------- |
| `pnpm build`       | Build all packages and apps     |
| `pnpm lint`        | Lint all packages and apps      |
| `pnpm check-types` | Type-check across the workspace |
| `pnpm format`      | Format files with Prettier      |

### Layer 2 — Enable Turborepo remote caching

Remote caching shares build and task outputs across machines and CI, so repeated runs skip work that has already been done.

Run these commands once per repository (or per developer machine):

```bash
pnpm dlx turbo login
pnpm turbo link
```

After linking, `pnpm build`, `pnpm lint`, and other Turborepo tasks can hit the remote cache when inputs have not changed.

### Layer 3 — Add a new application

Use `create-next-app` to scaffold another Next.js app inside `apps/`:

```bash
pnpm dlx create-next-app@latest apps/my-app
```

Then wire the new app into the monorepo:

1. Add workspace dependencies (`@workspace/ui`, `@workspace/eslint-config`, `@workspace/typescript-config`) as needed.
2. Extend `@workspace/typescript-config/nextjs.json` in the app `tsconfig.json`.
3. Point Tailwind at `@workspace/ui` globals (see `apps/web` for reference).
4. Add a `components.json` if the app uses shadcn/ui (see `apps/web/components.json`).

### Layer 4 — Extend the stack for a product

When building a real product from this template, typical next steps:

**Database (Drizzle)** — use the shared `packages/db` workspace for schema and migrations:

```bash
pnpm --filter @workspace/db db:generate
pnpm --filter @workspace/db db:migrate
```

**Auth (Better Auth)** — use the shared `packages/auth` workspace. The default Next.js app owns an app-local `lib/auth.ts` and mounts it from `app/api/auth/[...all]/route.ts`.

```ts
import { createAuth } from "@workspace/auth/server";

export const orgAdminAuth = createAuth({
  features: {
    admin: true,
    organization: {
      teams: {
        enabled: true,
      },
    },
  },
});
```

Configure database credentials in `packages/db/.env`, auth secrets and feature
flags in `packages/auth/.env`, and app URLs such as `BETTER_AUTH_URL` in
`apps/web/.env`.

**Validation (Zod)** — already available via the workspace catalog. Reference shared schemas from a `packages/validators` workspace or import directly in apps.

**AI (Mastra)** — use the shared `packages/ai` workspace for reusable agents, tools, workflows, and memory helpers:

```bash
pnpm --filter @workspace/ai dev
pnpm --filter @workspace/ai build
```

Configure AI provider keys in `packages/ai/.env`. If Mastra should use storage,
set `DATABASE_URL` or `AI_DATABASE_URL` in `packages/ai/.env` because the AI
package owns the storage runtime. Add agents by domain under
`packages/ai/src/mastra/agents/*` and register the domain from
`packages/ai/src/mastra/agents/index.ts`.

The models folder exports provider-prefixed AI SDK models directly. For Azure OpenAI or Azure AI Foundry deployments:

```env
AZURE_OPENAI_RESOURCE_NAME="your-resource-name"
AZURE_OPENAI_API_KEY="your-api-key"
AZURE_OPENAI_GPT4O_DEPLOYMENT_NAME="your-gpt-4o-deployment"
AZURE_OPENAI_GPT5_DEPLOYMENT_NAME="your-gpt-5-deployment"
AZURE_OPENAI_WEATHER_ITINERARY_DEPLOYMENT_NAME="your-weather-itinerary-deployment"
AZURE_OPENAI_TEXT_EMBEDDING_DEPLOYMENT_NAME="text-embedding-3-small"
```

**UI (shadcn/ui)** — add components to the shared UI package:

```bash
pnpm dlx shadcn@latest add button -c packages/ui
```

Apps consume components from `@workspace/ui/components/*`.

## Dependency versions

Shared dependency versions are centralized in `pnpm-workspace.yaml` under `catalog`. Workspace packages reference them with the `catalog:` protocol:

```yaml
# pnpm-workspace.yaml
catalog:
  "@t3-oss/env-core": 0.13.11
  "@t3-oss/env-nextjs": 0.13.11
  typescript: 5.9.2
  zod: ^4.4.3
```

```json
"typescript": "catalog:",
"zod": "catalog:"
```

To bump a shared version, update the catalog entry and run `pnpm install`. Root `package.json` also defines `pnpm.overrides` so all workspaces resolve to the same catalog versions.

`catalog-mode=strict` in `.npmrc` ensures new dependencies must use catalog versions where defined.

## Turborepo pipeline

Task configuration lives in `turbo.json`:

- **`build`** — depends on upstream builds; caches `.next` output (excluding cache/dev dirs).
- **`lint`** — depends on upstream lint tasks.
- **`check-types`** — depends on upstream type checks.
- **`dev`** — persistent, not cached.

The root `turbo.json` does not declare centralized `globalEnv`. It uses
package-specific task entries, such as `web#build` and `@workspace/ai#build`,
to keep env allowlists and `.env*` inputs scoped to the app or package that
consumes those values.

## License

Private template — use as the base for your own projects.
