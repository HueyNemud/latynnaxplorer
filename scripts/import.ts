// Importe un volume en base : node scripts/import.ts data/<volume>
// Le dossier contient volume.json, <volume>.document.json et <volume>.structure.json.
// Le volume est remplacé en entier, dans une transaction.

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { connect } from "../lib/db/client.ts";
import { loadRows } from "./load.ts";
import { toRows } from "./rows.ts";
import { validateVolume } from "./validate.ts";

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

const dir = process.argv[2];
if (!dir) throw new Error("usage : node scripts/import.ts data/<volume>");

const rows = toRows(
  validateVolume({
    volume: readJson(join(dir, "volume.json")),
    document: readJson(exportFile(dir, ".document.json")),
    structure: readJson(exportFile(dir, ".structure.json")),
  }),
);

const client = connect();
try {
  await loadRows(client, rows);
} finally {
  await client.end();
}

console.log(
  `${rows.volume.id} : ${rows.nodes.length} nœuds, ${rows.spans.length} empans, ${rows.anchors.length} ancres`,
);
