// Lecture d'un dossier de volume (data/<volume>) : volume.json, <volume>.document.json et
// <volume>.structure.json, validés.

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { type VolumeFiles, validateVolume } from "./validate.ts";

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

/** Les trois fichiers du volume, vérifiés contre leurs schémas. */
export function readVolume(dir: string): VolumeFiles {
  return validateVolume({
    volume: readJson(join(dir, "volume.json")),
    document: readJson(exportFile(dir, ".document.json")),
    structure: readJson(exportFile(dir, ".structure.json")),
  });
}
