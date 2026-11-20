// Passage des fichiers validés d'un volume numrev à son fichier pour le navigateur
// (lib/query/volume.ts) : simple projection, sans correction. Ce qui se déduit est omis (ordre
// de lecture, texte normalisé égal à celui de l'empan, empans et ancres absents).

import type { Anchor } from "../lib/query/types.ts";
import type {
  FileNode,
  FileSpan,
  IndexedVolume,
  VolumeFile,
  VolumeIndex,
} from "../lib/query/volume.ts";
import type { Bbox, VolumeFiles } from "./validate.ts";

interface Line {
  page: number;
  bbox: Bbox | null;
}

/**
 * Ancres d'un nœud : par page, l'union des boîtes de ses lignes.
 * Une page où aucune de ses lignes n'a de boîte ne donne pas d'ancre.
 */
export function anchorsOf(nodeId: string, lineIds: string[], lines: Map<string, Line>): Anchor[] {
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
  return [...boxes].map(([page, [x0, y0, x1, y1]]) => ({ page, x0, y0, x1, y1 }));
}

/** Refuse une boucle dans les parents : le parcours des ancêtres ne finirait pas. */
export function refuseLoops(nodes: { id: string; parentId: string | null }[]): void {
  const parentOf = new Map(nodes.map((n) => [n.id, n.parentId]));
  const safe = new Set<string>(); // nœuds dont les ancêtres mènent à une racine
  for (const { id } of nodes) {
    const path = new Set<string>();
    for (let a: string | null = id; a !== null && !safe.has(a); a = parentOf.get(a) ?? null) {
      if (path.has(a)) throw new Error(`nœud ${id} : boucle dans ses parents`);
      path.add(a);
    }
    for (const a of path) safe.add(a);
  }
}

export function toVolumeFile({ volume: meta, document, structure }: VolumeFiles): VolumeFile {
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
    ...structure.titles.map((t) => ({
      ...t,
      kind: "section" as const,
      text: t.heading,
      spans: [],
    })),
    ...structure.entries.map((e) => ({ ...e, kind: "entry" as const })),
    ...structure.out_of_scope.map((o) => ({ ...o, kind: "out_of_scope" as const, spans: [] })),
  ];

  // Un nœud prend dans l'ordre de lecture la place de sa première ligne.
  const nodes = items
    .map((item) => ({ item, order: firstLineOrder(item.id, item.lines) }))
    .sort((a, b) => a.order - b.order)
    .map(({ item }): FileNode => {
      const node: FileNode = {
        id: item.id,
        kind: item.kind,
        parentId: parentOf(item.parent),
        text: item.text,
      };
      const chars = Array.from(item.text); // positions des empans en points de code
      const spans = item.spans
        .toSorted((a, b) => a.start - b.start || a.end - b.end)
        .map(({ label, start, end, normalized }): FileSpan => {
          const span = { label, charStart: start, charEnd: end };
          return normalized === chars.slice(start, end).join("") ? span : { ...span, normalized };
        });
      if (spans.length > 0) node.spans = spans;
      const anchors = anchorsOf(
        item.id,
        item.lines.map((ref) => ref.line),
        lines,
      ).sort((a, b) => a.page - b.page);
      if (anchors.length > 0) node.anchors = anchors;
      return node;
    });
  refuseLoops(nodes);

  return {
    volume: { id: meta.identifier, title: meta.title, temporalStart: meta.temporal.start },
    nodes,
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
