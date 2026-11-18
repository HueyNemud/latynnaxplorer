import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) process.loadEnvFile(); // .env, voir .env.example
const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL absente de l'environnement et de .env");

export default defineConfig({
  dialect: "postgresql",
  schema: "./lib/db/schema.ts",
  extensionsFilters: ["postgis"], // ignorer spatial_ref_sys, créée par l'image PostGIS
  dbCredentials: { url },
});
