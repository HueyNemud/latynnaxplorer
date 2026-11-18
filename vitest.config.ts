import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // base PostgreSQL de test recréée avant les tests (serveur de DATABASE_URL)
    globalSetup: ["./scripts/test-database.ts"],
  },
});
