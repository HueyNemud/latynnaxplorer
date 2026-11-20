// Exporte un volume en fichier pour le navigateur (essai des données en local) :
// node scripts/export-volume.ts data/<volume>  →  public/volumes/<volume>.json
// Le fichier est servi tel quel ; la compression revient au serveur.

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { readVolume } from "./read.ts";
import { toRows } from "./rows.ts";
import { toVolumeFile } from "./volume-file.ts";

const OUT = "public/volumes";

const dir = process.argv[2];
if (!dir) throw new Error("usage : node scripts/export-volume.ts data/<volume>");

const file = toVolumeFile(toRows(readVolume(dir)));
const json = JSON.stringify(file);
mkdirSync(OUT, { recursive: true });
const path = join(OUT, `${file.volume.id}.json`);
writeFileSync(path, json);
console.log(`${path} : ${file.nodes.length} nœuds, ${(json.length / 1e6).toFixed(1)} Mo`);
