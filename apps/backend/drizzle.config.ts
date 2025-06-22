import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString:
      process.env.DATABASE_URL ||
      'postgresql://postgres:postgres@localhost:5432/htf_sunup_db',
  },
} satisfies Config;
