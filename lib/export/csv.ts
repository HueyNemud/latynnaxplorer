// Export de la sélection en CSV (docs/DESIGN.md, « Export ») : une ligne par nœud, volume après
// volume, chacun dans l'ordre de lecture ; une colonne par niveau de rubrique du chemin, une par
// libellé d'empan. Textes tels que numrev les donne. Fonction pure.

import { volumeOf } from "../query/explore.ts";
import type { SpanLabel, SubgraphNode } from "../query/types.ts";
import { ancestors, type LoadedVolume } from "../query/volume.ts";

/** Séparateur de plusieurs valeurs dans une case : empans de même libellé, pages. */
const MANY = " | ";

/**
 * Les nœuds sélectionnés, en CSV (RFC 4180, fins de ligne CRLF), précédé d'un BOM pour que les
 * tableurs le lisent en UTF-8. Autant de colonnes `section_<n>` que le chemin le plus long.
 */
export function selectionCsv(
  loaded: readonly LoadedVolume[],
  selection: readonly SubgraphNode[],
): string {
  const rows = selection.map((node) => {
    const volume = volumeOf(loaded, node.id);
    if (volume === undefined) throw new Error(`nœud hors des volumes chargés : ${node.id}`);
    const path = [...ancestors(volume, node)].reverse().map((s) => s.text);
    return { volume: volume.meta.id, node, path };
  });
  const depth = Math.max(0, ...rows.map((r) => r.path.length));
  const levels = Array.from({ length: depth }, (_, i) => i);
  const spans = (node: SubgraphNode, label: SpanLabel) =>
    node.spans
      .filter((s) => s.label === label)
      .map((s) => s.normalized)
      .join(MANY);

  const header = [
    "volume",
    "id",
    "kind",
    "parent_id",
    "reading_order",
    ...levels.map((i) => `section_${i + 1}`),
    "text",
    "subject",
    "description",
    "address",
    "pages",
  ];
  const lines = rows.map(({ volume, node, path }) => [
    volume,
    node.id,
    node.kind,
    node.parentId ?? "",
    String(node.documentReadingOrder),
    ...levels.map((i) => path[i] ?? ""),
    node.text,
    spans(node, "SUBJ"),
    spans(node, "DESC"),
    spans(node, "ADDR"),
    [...new Set(node.anchors.map((a) => a.page))].join(MANY),
  ]);
  return `﻿${[header, ...lines].map((line) => `${line.map(field).join(",")}\r\n`).join("")}`;
}

/** Une case : entre guillemets, doublés, si elle contient une virgule, un guillemet ou un saut
 * de ligne. */
function field(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}
