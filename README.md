# Project Stack Template

A monorepo starter for products built on a shared, opinionated stack. Clone this template when starting a new project and extend it with app-specific packages (database, auth, API routes, etc.) as needed.

## Stack

| Layer      | Tool                                         | Role                                          |
| ---------- | -------------------------------------------- | --------------------------------------------- |
| Monorepo   | [Turborepo](https://turbo.build)             | Task orchestration, caching, and CI pipelines |
| Language   | [TypeScript](https://www.typescriptlang.org) | End-to-end type safety                        |
| Validation | [Zod](https://zod.dev)                       | Runtime schemas and input validation          |
| ORM        | [Drizzle](https://orm.drizzle.team)          | Type-safe database access and migrations      |
| Auth       | [Better Auth](https://www.better-auth.com)   | Authentication and session management         |
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

**Auth (Better Auth)** — use the shared `packages/auth` workspace. The default Next.js app already mounts `app/api/auth/[...all]/route.ts` from `@workspace/auth/next`.

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

Configure `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, and optional `AUTH_FEATURES` values from `.env.example`.

**Validation (Zod)** — already available via the workspace catalog. Reference shared schemas from a `packages/validators` workspace or import directly in apps.

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

Environment files matching `.env*` are included as build inputs.

## License

Private template — use as the base for your own projects.
