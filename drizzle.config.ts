import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",  // ✅ Update this if your schema is elsewhere
  out: "./drizzle",
  driver: "pg",                  // ✅ this is valid in v0.31+
  dialect: "postgresql",         // ✅ required
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
});
