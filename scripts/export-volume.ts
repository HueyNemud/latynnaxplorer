// Exporte un volume pour le navigateur : node scripts/export-volume.ts data/<volume> [dossier]
// Écrit <dossier>/<volume>.json et l'ajoute à <dossier>/index.json (créé au besoin) ; dossier
// par défaut : public/volumes, servi en développement. Fichiers à héberger tels quels ; la
// compression revient au serveur.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { VolumeIndex } from "../lib/local/types.ts";
import { readVolume } from "./read.ts";
import { toRows } from "./rows.ts";
import { toVolumeFile, withVolume } from "./volume-file.ts";

const [dir, out = "public/volumes"] = process.argv.slice(2);
if (!dir) throw new Error("usage : node scripts/export-volume.ts data/<volume> [dossier]");

const file = toVolumeFile(toRows(readVolume(dir)));
const json = JSON.stringify(file);
mkdirSync(out, { recursive: true });
const name = `${file.volume.id}.json`;
writeFileSync(join(out, name), json);

const indexPath = join(out, "index.json");
const index: VolumeIndex = existsSync(indexPath)
  ? JSON.parse(readFileSync(indexPath, "utf8"))
  : { volumes: [] };
writeFileSync(
  indexPath,
  `${JSON.stringify(withVolume(index, { ...file.volume, url: name }), null, 2)}\n`,
);

console.log(
  `${join(out, name)} : ${file.nodes.length} nœuds, ${(json.length / 1e6).toFixed(1)} Mo`,
);
