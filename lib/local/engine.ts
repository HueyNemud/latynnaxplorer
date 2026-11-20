// Essai des données en local : les requêtes résolues dans le navigateur, sur le fichier d'un
// volume (lib/local/types.ts), avec la même sémantique que la version SQL (lib/query/resolve.ts,
// lib/query/facets.ts), qui fait foi. Fonctions pures, sans dépendance.

import type { Query } from "../query/query.ts";
import { inducedArcs, NodeNotFoundError, type SelectedNode } from "../query/resolve.ts";
import type { FacetSection, Facets, Subgraph, SubgraphNode } from "../query/types.ts";
import type { VolumeFile } from "./types.ts";

/** Lettres et signes que `unaccent` de PostgreSQL remplace et que la décomposition NFKD ne
 * réduit pas : ceux de l'imprimé français. Les autres règles d'unaccent (formes pleine chasse,
 * unités, lettres entourées) sont pour l'essai laissées de côté. */
const UNACCENT: Record<string, string> = {
  Æ: "AE",
  æ: "ae",
  Œ: "OE",
  œ: "oe",
  ß: "ss",
  Ø: "O",
  ø: "o",
  Ł: "L",
  ł: "l",
  Đ: "D",
  đ: "d",
  Ð: "D",
  ð: "d",
  ı: "i",
  ſ: "s",
  "«": "<<",
  "»": ">>",
  "‹": "<",
  "›": ">",
  "‐": "-",
  "‑": "-",
  "‒": "-",
  "–": "-",
  "—": "-",
  "―": "-",
  "−": "-",
  "‘": "'",
  "’": "'",
  "‛": "'",
  "‚": ",",
  "“": '"',
  "”": '"',
  "„": ",,",
  "…": "...",
};
const SPECIAL = new RegExp(`[${Object.keys(UNACCENT).join("")}]`, "gu");

/** Texte sans accents ni casse, comme `lower(immutable_unaccent(...))` (lib/query/contains.ts). */
export function fold(text: string): string {
  return text
    .replace(SPECIAL, (c) => UNACCENT[c] ?? c)
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

/** Un volume prêt à être interrogé : ses nœuds, et ce qui se calcule une fois au chargement. */
export interface LocalVolume {
  file: VolumeFile;
  byId: Map<string, SubgraphNode>;
  /** texte plié de chaque nœud, dans l'ordre de `file.nodes` */
  folded: string[];
  /** entrée suivante dans l'ordre de lecture (arc follows), pour les entrées */
  nextEntry: Map<string, string>;
}

export function indexVolume(file: VolumeFile): LocalVolume {
  const nextEntry = new Map<string, string>();
  let next: string | undefined;
  for (const n of file.nodes.toReversed()) {
    if (n.kind !== "entry") continue;
    if (next !== undefined) nextEntry.set(n.id, next);
    next = n.id;
  }
  return {
    file,
    byId: new Map(file.nodes.map((n) => [n.id, n])),
    folded: file.nodes.map((n) => fold(n.text)),
    nextEntry,
  };
}

/** Nœuds que désigne la requête, dans l'ordre de lecture (comme `selection` en SQL). */
function selection(volume: LocalVolume, { subtree, text }: Query): SubgraphNode[] {
  if (subtree === undefined && text === undefined) return [];
  const roots = new Set(subtree);
  // un nœud est dans l'union des sous-arbres s'il en est une racine ou si un ancêtre l'est
  const inside = new Map<string | null, boolean>([[null, false]]);
  const isInside = (n: SubgraphNode): boolean => {
    let result = inside.get(n.id);
    if (result === undefined) {
      const parent = n.parentId === null ? undefined : volume.byId.get(n.parentId);
      result = roots.has(n.id) || (parent !== undefined && isInside(parent));
      inside.set(n.id, result);
    }
    return result;
  };
  const needle = text === undefined ? undefined : fold(text);
  return volume.file.nodes.filter(
    (n, i) =>
      (needle === undefined || volume.folded[i]?.includes(needle)) &&
      (subtree === undefined || isInside(n)),
  );
}

/** Comme `resolve` : sous-graphe induit ; un `subtree` inconnu est une erreur. */
export function resolveLocal(volume: LocalVolume, query: Query): Subgraph {
  const unknown = query.subtree?.find((id) => !volume.byId.has(id));
  if (unknown !== undefined) throw new NodeNotFoundError(unknown);
  const nodes = selection(volume, query);
  const rows: SelectedNode[] = nodes.map(({ spans: _, anchors: __, ...n }) => ({
    ...n,
    nextEntryId: volume.nextEntry.get(n.id) ?? null,
  }));
  return { nodes, arcs: inducedArcs(rows) };
}

/** Comme `context` : rubriques ancêtres de la sélection qui n'en font pas partie. */
export function contextLocal(volume: LocalVolume, query: Query): SubgraphNode[] {
  const selected = selection(volume, query);
  const ids = new Set(selected.map((n) => n.id));
  const ancestors = new Set<SubgraphNode>();
  for (const n of selected) {
    for (let a = n.parentId; a !== null; ) {
      const parent = volume.byId.get(a);
      if (parent === undefined || ancestors.has(parent)) break;
      if (!ids.has(parent.id)) ancestors.add(parent);
      a = parent.parentId;
    }
  }
  return [...ancestors]
    .sort((a, b) => a.documentReadingOrder - b.documentReadingOrder)
    .map((n) => ({ ...n, spans: [] }));
}

/** Comme `facets` : le volume, et ses rubriques avec le nombre d'entrées de leur sous-arbre qui
 * contiennent le texte cherché. */
export function facetsLocal(volume: LocalVolume, { text }: Pick<Query, "text">): Facets {
  const needle = text === undefined ? undefined : fold(text);
  const entries = new Map<string, number>();
  volume.file.nodes.forEach((n, i) => {
    if (n.kind !== "entry" || (needle !== undefined && !volume.folded[i]?.includes(needle))) return;
    for (let a = n.parentId; a !== null; a = volume.byId.get(a)?.parentId ?? null)
      entries.set(a, (entries.get(a) ?? 0) + 1);
  });
  const sections = volume.file.nodes
    .filter((n) => n.kind === "section")
    .map(
      (n): FacetSection => ({
        id: n.id,
        parentId: n.parentId,
        volumeId: volume.file.volume.id,
        text: n.text,
        entries: entries.get(n.id) ?? 0,
      }),
    );
  return { volumes: [volume.file.volume], sections };
}
