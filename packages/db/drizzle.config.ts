import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    out: './src/migrations',
    schema: './src/schema/**/*.ts',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
    casing: 'snake_case',
    schemaFilter: 'postgres',
    strict: true,
    verbose: true,
    migrations: {
        prefix: 'timestamp',
        table: '__drizzle_migrations__',
        schema: 'postgres',
    },
});
