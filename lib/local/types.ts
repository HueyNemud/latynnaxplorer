// Fichiers lus par le navigateur, hébergés en ligne : l'index des volumes, et le fichier de
// chaque volume. Écrits par scripts/export-volume.ts ; JSON compact, lisible tel quel.

import type { Anchor, FacetVolume, NodeKind, Span } from "../query/types.ts";

/** Index des volumes : leurs métadonnées, et l'adresse de leur fichier. */
export interface VolumeIndex {
  /** dans l'ordre des dates */
  volumes: IndexedVolume[];
}

export interface IndexedVolume extends FacetVolume {
  /** adresse du fichier du volume, absolue ou relative à celle de l'index */
  url: string;
}

/** Fichier d'un volume. */
export interface VolumeFile {
  volume: FacetVolume;
  /** tous les nœuds du volume, dans l'ordre de lecture : leur rang est leur ordre de lecture */
  nodes: FileNode[];
}

/** Un nœud ; ses empans et ses ancres omis s'il n'en a pas. */
export interface FileNode {
  id: string;
  kind: NodeKind;
  parentId: string | null;
  text: string;
  spans?: FileSpan[];
  anchors?: Anchor[];
}

/** Un empan ; `normalized` omis quand il est le texte de l'empan tel quel. */
export interface FileSpan extends Omit<Span, "normalized"> {
  normalized?: string;
}
