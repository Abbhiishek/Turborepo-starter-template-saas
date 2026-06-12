# `@workspace/db`

Shared Drizzle Postgres package for database clients, schema, migrations, and
database-owned environment variables.

## Environment

All database credentials belong in this package. Do not place database URLs in
the root env file, app env files, or `packages/ai/.env`.

Create `packages/db/.env` from `packages/db/.env.example`:

```env
DATABASE_URL="postgres://user:password@localhost:5432/app"
AI_DATABASE_URL=""
```

`DATABASE_URL` is the primary app database. `AI_DATABASE_URL` is optional and
only needed when Mastra should use a separate database for memory, datasets,
experiments, or score history.

## Scripts

```bash
pnpm --filter @workspace/db db:generate
pnpm --filter @workspace/db db:migrate
pnpm --filter @workspace/db db:studio
```

The package uses `dotenv/config` in its Drizzle entrypoints and reads values
directly from `process.env`. By default, `dotenv/config` loads `.env` from the
package command's current working directory. If the repo standardizes on
`.env.local` for package CLIs, load that at the script boundary rather than
adding package-level env loader helpers.
