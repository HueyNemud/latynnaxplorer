// Passage des lignes d'un volume (rows.ts) à son fichier pour le navigateur (lib/local/types.ts) :
// les mêmes données qu'en base, sans ce qui se recalcule (fermeture des parents, entrée suivante).

import type { VolumeFile } from "../lib/local/types.ts";
import type { Anchor, Span } from "../lib/query/types.ts";
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
  const spans = byNode(
    rows.spans as (Span & { nodeId: string })[],
    (a, b) => a.charStart - b.charStart || a.charEnd - b.charEnd,
  );
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
      .map((n) => ({
        id: n.id,
        kind: n.kind,
        parentId: n.parentId ?? null,
        documentReadingOrder: n.documentReadingOrder,
        text: n.text,
        spans: spans.get(n.id) ?? [],
        anchors: anchors.get(n.id) ?? [],
      })),
  };
}
