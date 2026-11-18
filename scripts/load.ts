// Chargement en base des lignes d'un volume (voir rows.ts) : le volume est remplacé en entier,
// dans une transaction. Utilisé par l'import et par la base de test.

import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import type postgres from "postgres";
import { anchor, node, span, volume } from "../lib/db/schema.ts";
import type { Rows } from "./rows.ts";

const BATCH_SIZE = 1000; // lignes par INSERT, sous la limite de 65 535 paramètres de PostgreSQL

function* batches<T>(rows: T[]): Generator<T[]> {
  for (let i = 0; i < rows.length; i += BATCH_SIZE) yield rows.slice(i, i + BATCH_SIZE);
}

export async function loadRows(client: postgres.Sql, rows: Rows): Promise<void> {
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
}
