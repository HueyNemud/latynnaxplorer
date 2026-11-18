// Connexion à la base PostgreSQL (postgres.js).

import postgres from "postgres";

/** DATABASE_URL de l'environnement, sinon de .env (voir .env.example). */
export function databaseUrl(): string {
  if (!process.env.DATABASE_URL) process.loadEnvFile();
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL absente de l'environnement et de .env");
  return url;
}

/** `onnotice` : que faire des avis du serveur (par défaut, console.log). */
export function connect(
  url: string = databaseUrl(),
  options?: { onnotice?: (notice: postgres.Notice) => void },
): postgres.Sql {
  return postgres(url, options);
}
