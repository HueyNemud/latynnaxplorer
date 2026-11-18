// Passage des fichiers validés d'un volume aux lignes des tables : simple projection, sans correction.

import type { anchor, node, parentClosure, span, volume } from "../lib/db/schema.ts";
import type { Bbox, VolumeFiles } from "./validate.ts";

export interface Rows {
  volume: typeof volume.$inferInsert;
  nodes: (typeof node.$inferInsert)[];
  parentClosure: (typeof parentClosure.$inferInsert)[];
  spans: (typeof span.$inferInsert)[];
  anchors: (typeof anchor.$inferInsert)[];
}

/**
 * Fermeture des nœuds parents : pour chaque nœud qui a des enfants, une ligne (ancêtre, lui)
 * vers lui-même et vers chacun de ses ancêtres. Refuse une boucle dans les parents.
 */
export function parentClosureOf(
  nodes: { id: string; parentId?: string | null }[],
): Rows["parentClosure"] {
  const parentOf = new Map(nodes.map((n) => [n.id, n.parentId ?? null]));
  const parents = new Set(nodes.flatMap((n) => (n.parentId ? [n.parentId] : [])));
  return [...parents].flatMap((descendantId) => {
    const ancestors: Rows["parentClosure"] = [];
    const seen = new Set<string>();
    for (let a: string | null = descendantId; a !== null; a = parentOf.get(a) ?? null) {
      if (seen.has(a)) throw new Error(`nœud ${descendantId} : boucle dans ses parents`);
      seen.add(a);
      ancestors.push({ ancestorId: a, descendantId });
    }
    return ancestors;
  });
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

  // document.json donne les pages et leurs lignes dans l'ordre de lecture du volume.
  const lines = new Map<string, Line>();
  const lineReadingOrder = new Map<string, number>();
  for (const page of document.pages) {
    for (const line of page.lines) {
      lines.set(line.id, { page: page.page, bbox: line.bbox_estimate });
      lineReadingOrder.set(line.id, lineReadingOrder.size);
    }
  }
  const firstLineOrder = (id: string, refs: { line: string }[]) => {
    const order = refs[0] && lineReadingOrder.get(refs[0].line);
    if (order === undefined)
      throw new Error(`nœud ${id} : première ligne absente de document.json`);
    return order;
  };

  // Un nœud par titre, entrée et élément hors champ ; le texte d'un titre est son « heading ».
  const items = [
    ...structure.titles.map((t) => ({ ...t, kind: "section" as const, text: t.heading })),
    ...structure.entries.map((e) => ({ ...e, kind: "entry" as const })),
    ...structure.out_of_scope.map((o) => ({ ...o, kind: "out_of_scope" as const })),
  ];

  // Un nœud prend dans l'ordre de lecture la place de sa première ligne.
  const nodes: Rows["nodes"] = items
    .map((item) => ({
      id: item.id,
      volumeId,
      kind: item.kind,
      parentId: parentOf(item.parent),
      text: item.text,
      lineOrder: firstLineOrder(item.id, item.lines),
    }))
    .sort((a, b) => a.lineOrder - b.lineOrder)
    .map(({ lineOrder: _, ...n }, documentReadingOrder) => ({ ...n, documentReadingOrder }));

  // Arc follows : chaque entrée pointe vers l'entrée suivante dans l'ordre de lecture.
  let nextEntryId: string | null = null;
  for (const n of nodes.toReversed()) {
    n.nextEntryId = n.kind === "entry" ? nextEntryId : null;
    if (n.kind === "entry") nextEntryId = n.id;
  }

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

  const anchors = items.flatMap((item) =>
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
    parentClosure: parentClosureOf(nodes),
    spans,
    anchors,
  };
}
