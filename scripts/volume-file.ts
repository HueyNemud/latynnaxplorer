// Passage des lignes d'un volume (rows.ts) à son fichier pour le navigateur (lib/local/types.ts) :
// les mêmes données qu'en base, sans ce qui se recalcule (ordre de lecture, fermeture des
// parents, entrée suivante) ni ce qui se déduit (texte normalisé égal au texte de l'empan).

import type {
  FileNode,
  FileSpan,
  IndexedVolume,
  VolumeFile,
  VolumeIndex,
} from "../lib/local/types.ts";
import type { Anchor } from "../lib/query/types.ts";
import type { Rows } from "./rows.ts";

/** Lignes regroupées par nœud, sans leur colonne `nodeId`, triées par `order`. */
function byNode<T extends { nodeId: string }>(
  rows: T[],
  order: (a: T, b: T) => number,
): Map<string, Omit<T, "nodeId">[]> {
  const groups = Map.groupBy(rows.toSorted(order), (r) => r.nodeId);
  return new Map([...groups].map(([id, g]) => [id, g.map(({ nodeId: _, ...r }) => r)]));
}

export function toVolumeFile(rows: Rows): VolumeFile {
  // même ordre que la lecture en base (lib/query/resolve.ts)
  const spans = byNode(rows.spans, (a, b) => a.charStart - b.charStart || a.charEnd - b.charEnd);
  const anchors = byNode(
    rows.anchors as (Anchor & { nodeId: string })[],
    (a, b) => a.page - b.page,
  );
  return {
    volume: {
      id: rows.volume.id,
      title: rows.volume.title ?? null,
      temporalStart: rows.volume.temporalStart,
    },
    nodes: rows.nodes
      .toSorted((a, b) => a.documentReadingOrder - b.documentReadingOrder)
      .map((n) => {
        const chars = Array.from(n.text); // positions des empans en points de code
        const node: FileNode = {
          id: n.id,
          kind: n.kind,
          parentId: n.parentId ?? null,
          text: n.text,
        };
        const s = spans.get(n.id)?.map(({ label, charStart, charEnd, normalized }): FileSpan => {
          const same = normalized === chars.slice(charStart, charEnd).join("");
          return same ? { label, charStart, charEnd } : { label, charStart, charEnd, normalized };
        });
        if (s?.length) node.spans = s;
        const a = anchors.get(n.id);
        if (a?.length) node.anchors = a;
        return node;
      }),
  };
}

/** L'index, le volume y étant ajouté ou remplacé ; dans l'ordre des dates. */
export function withVolume(index: VolumeIndex, volume: IndexedVolume): VolumeIndex {
  return {
    volumes: [...index.volumes.filter((v) => v.id !== volume.id), volume].sort(
      (a, b) => a.temporalStart.localeCompare(b.temporalStart) || a.id.localeCompare(b.id),
    ),
  };
}
