import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    host: 'ep-shy-feather-a1vxl51q-pooler.ap-southeast-1.aws.neon.tech',
    port: 5432,
    user: 'neondb_owner',
    password: 'npg_j3mkIHAVi8te',
    database: 'neondb',
    ssl: 'require'
  },
  verbose: true,
});