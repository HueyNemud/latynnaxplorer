// Exporte un volume pour le navigateur : node scripts/export-volume.ts data/<volume> [dossier]
// Écrit <dossier>/<volume>.json et l'ajoute à <dossier>/index.json (créé au besoin) ; dossier
// par défaut : public/volumes, servi en développement. Fichiers à héberger tels quels ; la
// compression revient au serveur.

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { VolumeIndex } from "../lib/query/volume.ts";
import { validateVolume } from "./validate.ts";
import { toVolumeFile, withVolume } from "./volume-file.ts";

const [dir, out = "public/volumes"] = process.argv.slice(2);
if (!dir) throw new Error("usage : node scripts/export-volume.ts data/<volume> [dossier]");

const readJson = (path: string): unknown => JSON.parse(readFileSync(path, "utf8"));

/** Le seul fichier du dossier du volume qui finit par `suffix` (livrable numrev). */
const exportFile = (suffix: string): string => {
  const names = readdirSync(dir).filter((name) => name.endsWith(suffix));
  if (names.length !== 1 || !names[0])
    throw new Error(`${dir} : un fichier *${suffix} attendu, ${names.length} trouvé(s)`);
  return join(dir, names[0]);
};

const file = toVolumeFile(
  validateVolume({
    volume: readJson(join(dir, "volume.json")),
    document: readJson(exportFile(".document.json")),
    structure: readJson(exportFile(".structure.json")),
  }),
);
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
