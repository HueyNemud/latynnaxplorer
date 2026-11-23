// Fichiers des volumes, hébergés en ligne : l'index des volumes, et le fichier de chaque volume
// (écrits par scripts/export-volume.ts ; docs/MODELE_DONNEES.md). Un fichier téléchargé est
// décodé et indexé une fois (indexVolume), puis interrogé (lib/query/resolve.ts).

import { fold } from "./fold.ts";
import type { Zone } from "./query.ts";
import type { Anchor, NodeKind, Span, SpanLabel, SubgraphNode, Volume } from "./types.ts";

/** Index des volumes : leurs métadonnées, et l'adresse de leur fichier. */
export interface VolumeIndex {
  /** dans l'ordre des dates */
  volumes: IndexedVolume[];
}

export interface IndexedVolume extends Volume {
  /** adresse du fichier du volume, absolue ou relative à celle de l'index */
  url: string;
}

/** Fichier d'un volume : JSON compact, sans ce qui se déduit. */
export interface VolumeFile {
  volume: Volume;
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
  meta: Volume;
  /** dans l'ordre de lecture, complets (empans et ancres, vides s'il n'y en a pas) */
  nodes: SubgraphNode[];
  byId: Map<string, SubgraphNode>;
  /** texte plié de chaque nœud (lib/query/fold.ts), dans l'ordre de `nodes` */
  folded: string[];
  /** texte plié de chaque nœud par zone (voir zoned), dans l'ordre de `nodes` */
  zoned: Record<Zone, string>[];
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
    zoned: nodes.map(zoned),
    nextEntry,
  };
}

/** Texte plié d'un nœud dans chaque zone : ses empans de ce libellé et, pour « other », son texte
 * hors empan ; les morceaux séparés par un saut de ligne, que le texte cherché ne contient pas. */
function zoned({ text, spans }: SubgraphNode): Record<Zone, string> {
  const chars = Array.from(text);
  const rest = [...chars];
  const pieces: Record<Zone, string[]> = { subj: [], desc: [], addr: [], other: [] };
  for (const s of spans) {
    pieces[s.label.toLowerCase() as Lowercase<SpanLabel>].push(
      chars.slice(s.charStart, s.charEnd).join(""),
    );
    rest.fill("\n", s.charStart, s.charEnd);
  }
  pieces.other.push(rest.join(""));
  const join = (zone: Zone) => fold(pieces[zone].join("\n"));
  return { subj: join("subj"), desc: join("desc"), addr: join("addr"), other: join("other") };
}

/** Rubriques au-dessus du nœud, de son parent à la racine. */
export function* ancestors(volume: LoadedVolume, node: SubgraphNode): Generator<SubgraphNode> {
  for (let id = node.parentId; id !== null; ) {
    const parent = volume.byId.get(id);
    if (parent === undefined) return;
    yield parent;
    id = parent.parentId;
  }
}
