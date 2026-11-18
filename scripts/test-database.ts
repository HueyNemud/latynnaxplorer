// Base de test (globalSetup de Vitest), recréée à chaque lancement : <base>_test sur le serveur
// de DATABASE_URL, avec lib/db/init.sql, le schéma (drizzle-kit push) et le volume de la
// fixture. Les tests obtiennent son URL par inject("databaseUrl"). La base de développement
// n'est jamais touchée.

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import type { TestProject } from "vitest/node";
import { connect, databaseUrl } from "../lib/db/client.ts";
import { fixture } from "./fixture.ts";
import { loadRows } from "./load.ts";
import { toRows } from "./rows.ts";
import { validateVolume } from "./validate.ts";

declare module "vitest" {
  export interface ProvidedContext {
    databaseUrl: string;
  }
}

const quiet = { onnotice: () => {} }; // pas d'avis « n'existe pas, ignoré » dans la sortie des tests

export default async function setup(project: TestProject): Promise<void> {
  const url = new URL(databaseUrl());
  const name = `${url.pathname.slice(1)}_test`;
  const testUrl = new URL(url);
  testUrl.pathname = `/${name}`;

  const admin = connect(url.href, quiet);
  try {
    await admin`DROP DATABASE IF EXISTS ${admin(name)} WITH (FORCE)`;
    await admin`CREATE DATABASE ${admin(name)}`;
  } finally {
    await admin.end();
  }

  const client = connect(testUrl.href, quiet);
  try {
    await client.unsafe(readFileSync(new URL("../lib/db/init.sql", import.meta.url), "utf8"));
    execFileSync("pnpm", ["exec", "drizzle-kit", "push", "--force"], {
      env: { ...process.env, DATABASE_URL: testUrl.href },
      stdio: "pipe",
    });
    await loadRows(client, toRows(validateVolume(fixture())));
  } finally {
    await client.end();
  }

  project.provide("databaseUrl", testUrl.href);
}
