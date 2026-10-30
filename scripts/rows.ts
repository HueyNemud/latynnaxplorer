// Passage des fichiers validés d'un volume aux lignes des tables : simple projection, sans correction.

import type { anchor, node, span, volume } from "../lib/db/schema.ts";
import type { Bbox, VolumeFiles } from "./validate.ts";

export interface Rows {
  volume: typeof volume.$inferInsert;
  nodes: (typeof node.$inferInsert)[];
  spans: (typeof span.$inferInsert)[];
  anchors: (typeof anchor.$inferInsert)[];
}

interface Line {
  page: number;
  bbox: Bbox | null;
}

/**
 * Ancres d'un nœud : par page, l'union des boîtes de ses lignes.
 * Une page où aucune de ses lignes n'a de boîte ne donne pas d'ancre.
 */
export function anchorsOf(
  nodeId: string,
  lineIds: string[],
  lines: Map<string, Line>,
): Rows["anchors"] {
  const boxes = new Map<number, Bbox>();
  for (const id of lineIds) {
    const line = lines.get(id);
    if (!line) throw new Error(`nœud ${nodeId} : ligne ${id} absente de document.json`);
    if (!line.bbox) continue;
    const box = boxes.get(line.page);
    boxes.set(
      line.page,
      box
        ? [
            Math.min(box[0], line.bbox[0]),
            Math.min(box[1], line.bbox[1]),
            Math.max(box[2], line.bbox[2]),
            Math.max(box[3], line.bbox[3]),
          ]
        : line.bbox,
    );
  }
  return [...boxes].map(([page, [x0, y0, x1, y1]]) => ({ nodeId, page, x0, y0, x1, y1 }));
}

export function toRows({ volume: meta, document, structure }: VolumeFiles): Rows {
  const volumeId = meta.identifier;
  const parentOf = (parent: string) => (parent === structure.root ? null : parent);

  const lines = new Map<string, Line>();
  for (const page of document.pages) {
    for (const line of page.lines)
      lines.set(line.id, { page: page.page, bbox: line.bbox_estimate });
  }

  // Titres puis entrées : un titre parent précède ses enfants dans la liste numrev.
  const nodes: Rows["nodes"] = [
    ...structure.titles.map((title, rank) => ({
      id: title.id,
      volumeId,
      kind: "section" as const,
      parentId: parentOf(title.parent),
      rank,
      text: title.heading,
    })),
    ...structure.entries.map((entry, rank) => ({
      id: entry.id,
      volumeId,
      kind: "entry" as const,
      parentId: parentOf(entry.parent),
      rank,
      text: entry.text,
    })),
  ];

  const spans = structure.entries.flatMap((entry) =>
    entry.spans.map((s) => ({
      id: s.id,
      nodeId: entry.id,
      label: s.label,
      charStart: s.start,
      charEnd: s.end,
      normalized: s.normalized,
    })),
  );

  const anchors = [...structure.titles, ...structure.entries].flatMap((item) =>
    anchorsOf(
      item.id,
      item.lines.map((ref) => ref.line),
      lines,
    ),
  );

  return {
    volume: {
      id: volumeId,
      title: meta.title,
      temporalStart: meta.temporal.start,
      temporalEnd: meta.temporal.end,
    },
    nodes,
    spans,
    anchors,
  };
}
