// Connexion à la base PostgreSQL (postgres.js).

import postgres from "postgres";

/** DATABASE_URL de l'environnement, sinon de .env (voir .env.example). */
export function databaseUrl(): string {
  if (!process.env.DATABASE_URL) process.loadEnvFile();
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL absente de l'environnement et de .env");
  return url;
}

export function connect(url: string = databaseUrl()): postgres.Sql {
  return postgres(url);
}
