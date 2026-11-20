// Importe un volume en base : node scripts/import.ts data/<volume>
// Le dossier contient volume.json, <volume>.document.json et <volume>.structure.json.
// Le volume est remplacé en entier, dans une transaction.

import { connect } from "../lib/db/client.ts";
import { loadRows } from "./load.ts";
import { readVolume } from "./read.ts";
import { toRows } from "./rows.ts";

const dir = process.argv[2];
if (!dir) throw new Error("usage : node scripts/import.ts data/<volume>");

const rows = toRows(readVolume(dir));

const client = connect();
try {
  await loadRows(client, rows);
} finally {
  await client.end();
}

console.log(
  `${rows.volume.id} : ${rows.nodes.length} nœuds, ${rows.parentClosure.length} lignes de fermeture, ` +
    `${rows.spans.length} empans, ${rows.anchors.length} ancres`,
);
