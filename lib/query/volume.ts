// Fichiers des volumes, hébergés en ligne : l'index des volumes, et le fichier de chaque volume
// (écrits par scripts/export-volume.ts ; docs/MODELE_DONNEES.md). Un fichier téléchargé est
// décodé et indexé une fois (indexVolume), puis interrogé (lib/query/resolve.ts).

import { fold } from "./fold.ts";
import type { Zone } from "./query.ts";
import type { Anchor, NodeKind, Span, SubgraphNode, Volume } from "./types.ts";

/** Index des volumes : leurs métadonnées, et l'adresse de leur fichier. */
export interface VolumeIndex {
  /** dans l'ordre des dates */
  volumes: IndexedVolume[];
}

export interface IndexedVolume extends Volume {
  /** adresse du fichier du volume, absolue ou relative à celle de l'index */
  url: string;
}

/** Nom d'un volume à l'écran : son année, puis son titre, sinon son identifiant. */
export function volumeName(volume: Volume): string {
  return `${volume.temporalStart.slice(0, 4)} ${volume.title ?? volume.id}`;
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
  return {
    meta: file.volume,
    nodes,
    byId: new Map(nodes.map((n) => [n.id, n])),
    folded: nodes.map((n) => fold(n.text)),
    zoned: nodes.map(zoned),
  };
}

/**
 * Les morceaux d'un texte de `length` points de code où chercher, [début, fin) : chaque empan
 * d'une zone demandée, et pour « other » chaque passage entre deux empans ; sans zone, tout le
 * texte. Le texte cherché doit tenir dans un morceau, pour la sélection comme pour le surlignage.
 */
export function zonePieces(
  length: number,
  spans: readonly Pick<Span, "label" | "charStart" | "charEnd">[],
  zones: readonly Zone[] | undefined,
): [number, number][] {
  if (zones === undefined) return [[0, length]];
  const result: [number, number][] = spans
    .filter((s) => zones.includes(s.label.toLowerCase() as Zone))
    .map((s) => [s.charStart, s.charEnd]);
  if (zones.includes("other")) {
    let at = 0;
    for (const s of spans.toSorted((a, b) => a.charStart - b.charStart)) {
      if (s.charStart > at) result.push([at, s.charStart]);
      at = Math.max(at, s.charEnd);
    }
    if (at < length) result.push([at, length]);
  }
  return result;
}

/** Texte plié d'un nœud dans chaque zone : ses morceaux (zonePieces), séparés par un saut de
 * ligne, que le texte cherché ne contient pas. */
function zoned({ text, spans }: SubgraphNode): Record<Zone, string> {
  const chars = Array.from(text);
  const join = (zone: Zone) =>
    fold(
      zonePieces(chars.length, spans, [zone])
        .map(([start, end]) => chars.slice(start, end).join(""))
        .join("\n"),
    );
  return { subj: join("subj"), desc: join("desc"), addr: join("addr"), other: join("other") };
}

/** Rubriques au-dessus d'un nœud d'un volume (ou d'une rubrique de l'arbre des facettes), de son
 * parent à la racine. */
export function* ancestors<T extends { parentId: string | null }>(
  { byId }: { byId: ReadonlyMap<string, T> },
  node: T | undefined,
): Generator<T> {
  for (let id = node?.parentId ?? null; id !== null; ) {
    const parent = byId.get(id);
    if (parent === undefined) return;
    yield parent;
    id = parent.parentId;
  }
}
