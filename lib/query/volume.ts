// Fichiers des volumes, hébergés en ligne : l'index des volumes, et le fichier de chaque volume
// (écrits par scripts/export-volume.ts ; docs/MODELE_DONNEES.md). Un fichier téléchargé est
// décodé et indexé une fois (indexVolume), puis interrogé (lib/query/resolve.ts).

import { fold } from "./fold.ts";
import type { Anchor, FacetVolume, NodeKind, Span, SubgraphNode } from "./types.ts";

/** Index des volumes : leurs métadonnées, et l'adresse de leur fichier. */
export interface VolumeIndex {
  /** dans l'ordre des dates */
  volumes: IndexedVolume[];
}

export interface IndexedVolume extends FacetVolume {
  /** adresse du fichier du volume, absolue ou relative à celle de l'index */
  url: string;
}

/** Fichier d'un volume : JSON compact, sans ce qui se déduit. */
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

/** Un volume prêt à être interrogé : ses nœuds, et ce qui se calcule une fois au chargement. */
export interface LoadedVolume {
  meta: FacetVolume;
  /** dans l'ordre de lecture, complets (empans et ancres, vides s'il n'y en a pas) */
  nodes: SubgraphNode[];
  byId: Map<string, SubgraphNode>;
  /** texte plié de chaque nœud (lib/query/fold.ts), dans l'ordre de `nodes` */
  folded: string[];
  /** entrée suivante dans l'ordre de lecture (arc follows), pour les entrées */
  nextEntry: Map<string, string>;
}

/** Le fichier d'un volume, décodé (ce que son format omet est rétabli) et indexé. */
export function indexVolume(file: VolumeFile): LoadedVolume {
  const nodes = file.nodes.map(
    ({ spans = [], anchors = [], ...n }, documentReadingOrder): SubgraphNode => {
      const chars = Array.from(n.text); // positions des empans en points de code
      return {
        ...n,
        documentReadingOrder,
        spans: spans.map(
          (s): Span => ({
            ...s,
            normalized: s.normalized ?? chars.slice(s.charStart, s.charEnd).join(""),
          }),
        ),
        anchors,
      };
    },
  );
  // follows : chaque entrée vers l'entrée suivante, à travers les sections
  const nextEntry = new Map<string, string>();
  let next: string | undefined;
  for (const n of nodes.toReversed()) {
    if (n.kind !== "entry") continue;
    if (next !== undefined) nextEntry.set(n.id, next);
    next = n.id;
  }
  return {
    meta: file.volume,
    nodes,
    byId: new Map(nodes.map((n) => [n.id, n])),
    folded: nodes.map((n) => fold(n.text)),
    nextEntry,
  };
}
