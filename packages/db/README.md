# `@workspace/db`

Shared Drizzle Postgres package for database clients, schema, migrations, and
database-owned environment variables.

## Environment

Database credentials used by `@workspace/db` belong in this package. Do not
place this package's `DATABASE_URL` in the root env file or app env files.
Packages that need their own database connection, such as `@workspace/ai`, own
their own env schema and `.env` entries.

Create `packages/db/.env` from `packages/db/.env.example`:

```env
DATABASE_URL="postgres://user:password@localhost:5432/app"
```

`DATABASE_URL` is the primary app database used by the shared Drizzle client.

## Scripts

```bash
pnpm --filter @workspace/db db:generate
pnpm --filter @workspace/db db:migrate
pnpm --filter @workspace/db db:studio
```

The package validates environment variables through `src/env.ts`. Drizzle
scripts and runtime code import that local env module instead of reading
`process.env` directly.
