// Validation des fichiers d'un volume avant export : rien n'est exporté d'un fichier non conforme.
// Les schémas numrev sont copiés de ../adresses_revolutionnaires/src/numrev/export/schemas/
// (commit 2548ce1) ; à recopier quand numrev change de version de format.

import { Ajv2020, type ValidateFunction } from "ajv/dist/2020.js";
import documentSchema from "./schemas/numrev-document-1.schema.json" with { type: "json" };
import structureSchema from "./schemas/numrev-structure-2.schema.json" with { type: "json" };
import volumeSchema from "./schemas/volume.schema.json" with { type: "json" };

/** Boîte [x0, y0, x1, y1], repère numrev 0–1000, origine en haut à gauche. */
export type Bbox = [number, number, number, number];

/** Référence d'un nœud vers une ligne de document.json. */
interface LineRef {
  line: string;
}

/** Champs de volume.json lus par l'export (le schéma garantit les autres). */
interface VolumeMeta {
  identifier: string;
  title: string | null;
  temporal: { start: string; end: string };
}

/** Champs de <volume>.document.json lus par l'export. */
interface NumrevDocument {
  volume: string;
  pages: { page: number; lines: { id: string; bbox_estimate: Bbox | null }[] }[];
}

/** Champs de <volume>.structure.json lus par l'export. */
interface NumrevStructure {
  volume: string;
  root: string;
  titles: { id: string; parent: string; heading: string; lines: LineRef[] }[];
  entries: {
    id: string;
    parent: string;
    text: string;
    lines: LineRef[];
    spans: {
      id: string;
      label: "SUBJ" | "DESC" | "ADDR";
      start: number;
      end: number;
      normalized: string;
    }[];
  }[];
  out_of_scope: { id: string; parent: string; text: string; lines: LineRef[] }[];
}

export interface VolumeFiles {
  volume: VolumeMeta;
  document: NumrevDocument;
  structure: NumrevStructure;
}

const ajv = new Ajv2020();
const validateVolumeMeta = ajv.compile<VolumeMeta>(volumeSchema);
const validateDocument = ajv.compile<NumrevDocument>(documentSchema);
const validateStructure = ajv.compile<NumrevStructure>(structureSchema);

function conform<T>(validate: ValidateFunction<T>, data: unknown, file: string): T {
  if (validate(data)) return data;
  const errors = (validate.errors ?? []).map((e) => `${e.instancePath || "/"} ${e.message}`);
  throw new Error(`${file} : non conforme au schéma : ${errors.join(" ; ")}`);
}

/** Vérifie les trois fichiers d'un volume contre leur schéma, puis qu'ils décrivent le même volume. */
export function validateVolume(files: {
  volume: unknown;
  document: unknown;
  structure: unknown;
}): VolumeFiles {
  const volume = conform(validateVolumeMeta, files.volume, "volume.json");
  const document = conform(validateDocument, files.document, "document.json");
  const structure = conform(validateStructure, files.structure, "structure.json");
  for (const [file, name] of [
    ["document.json", document.volume],
    ["structure.json", structure.volume],
  ]) {
    if (name !== volume.identifier) {
      throw new Error(`${file} : volume « ${name} », volume.json : « ${volume.identifier} »`);
    }
  }
  return { volume, document, structure };
}
