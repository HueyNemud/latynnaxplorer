// Importe un volume en base : node scripts/import.ts data/<volume>
// Le dossier contient volume.json, <volume>.document.json et <volume>.structure.json.
// Le volume est remplacé en entier, dans une transaction.

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { anchor, node, span, volume } from "../lib/db/schema.ts";
import { toRows } from "./rows.ts";
import { validateVolume } from "./validate.ts";

const BATCH_SIZE = 1000; // lignes par INSERT, sous la limite de 65 535 paramètres de PostgreSQL

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8"));
}

function exportFile(dir: string, suffix: string): string {
  const names = readdirSync(dir).filter((name) => name.endsWith(suffix));
  if (names.length !== 1 || !names[0]) {
    throw new Error(`${dir} : un fichier *${suffix} attendu, ${names.length} trouvé(s)`);
  }
  return join(dir, names[0]);
}

function* batches<T>(rows: T[]): Generator<T[]> {
  for (let i = 0; i < rows.length; i += BATCH_SIZE) yield rows.slice(i, i + BATCH_SIZE);
}

const dir = process.argv[2];
if (!dir) throw new Error("usage : node scripts/import.ts data/<volume>");
if (!process.env.DATABASE_URL) process.loadEnvFile(); // .env, voir .env.example
const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL absente de l'environnement et de .env");

const rows = toRows(
  validateVolume({
    volume: readJson(join(dir, "volume.json")),
    document: readJson(exportFile(dir, ".document.json")),
    structure: readJson(exportFile(dir, ".structure.json")),
  }),
);

const client = postgres(url);
try {
  await drizzle(client).transaction(async (tx) => {
    await tx.delete(volume).where(eq(volume.id, rows.volume.id)); // supprime ses nœuds en cascade
    await tx.insert(volume).values(rows.volume);
    for (const batch of batches(rows.nodes)) await tx.insert(node).values(batch);
    for (const batch of batches(rows.spans)) await tx.insert(span).values(batch);
    for (const batch of batches(rows.anchors)) await tx.insert(anchor).values(batch);
  });
  // Hors transaction : statistiques à jour pour le planificateur, et carte de visibilité
  // remplie pour que les parcours d'index seul ne relisent pas la table.
  await client`VACUUM (ANALYZE) volume, node, span, anchor`;
} finally {
  await client.end();
}

console.log(
  `${rows.volume.id} : ${rows.nodes.length} nœuds, ${rows.spans.length} empans, ${rows.anchors.length} ancres`,
);
