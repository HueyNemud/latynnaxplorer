// Résolution d'une requête sur un volume chargé (docs/SCENARIOS.md, docs/MODELE_DONNEES.md) :
// la sélection, son contexte, et le sous-graphe induit. Plusieurs volumes : lib/query/explore.ts.
// Fonctions pures.

import { fold } from "./fold.ts";
import type { Query } from "./query.ts";
import type { Arc, Subgraph, SubgraphNode } from "./types.ts";
import { ancestors, type LoadedVolume } from "./volume.ts";

/** Le nœud désigné par la requête n'existe pas. */
export class NodeNotFoundError extends Error {
  override name = "NodeNotFoundError";

  constructor(nodeId: string) {
    super(`nœud inconnu : ${nodeId}`);
  }
}

/** Le texte plié du nœud de rang `i`, dans les zones demandées, contient-il le texte cherché,
 * plié (phrase entière, à la lettre) ? Sans texte, tout nœud convient. */
export function matcher(
  volume: LoadedVolume,
  { text, zones }: Pick<Query, "text" | "zones">,
): (i: number) => boolean {
  if (text === undefined) return () => true;
  const needle = fold(text);
  if (zones === undefined) return (i) => volume.folded[i]?.includes(needle) ?? false;
  return (i) => zones.some((z) => volume.zoned[i]?.[z].includes(needle));
}

/**
 * Nœuds que désigne la requête, dans l'ordre de lecture : conjonction de ses critères ; sans
 * critère, rien. Sous-arbre : les nœuds désignés et tous leurs descendants (un nœud désigné qui
 * n'est pas de ce volume n'y désigne rien).
 */
export function selection(volume: LoadedVolume, query: Query): SubgraphNode[] {
  const { subtree, text } = query;
  if (subtree === undefined && text === undefined) return [];
  const roots = new Set(subtree);
  const inSubtree = (n: SubgraphNode) => {
    if (roots.has(n.id)) return true;
    for (const a of ancestors(volume, n)) if (roots.has(a.id)) return true;
    return false;
  };
  const matches = matcher(volume, query);
  return volume.nodes.filter((n, i) => matches(i) && (subtree === undefined || inSubtree(n)));
}

/**
 * Contexte d'une sélection : les rubriques ancêtres de ses nœuds qui n'en font pas partie,
 * chacune une fois, dans l'ordre de lecture. Montrées comme la sélection, mais à part : le
 * contexte l'entoure sans en faire partie (docs/DESIGN.md, « Principes d'affichage »).
 */
export function context(volume: LoadedVolume, selected: readonly SubgraphNode[]): SubgraphNode[] {
  const ids = new Set(selected.map((n) => n.id));
  const result = new Set<SubgraphNode>();
  for (const n of selected) {
    for (const a of ancestors(volume, n)) {
      if (result.has(a)) break; // ses ancêtres y sont déjà
      if (!ids.has(a.id)) result.add(a);
    }
  }
  return [...result].sort((a, b) => a.documentReadingOrder - b.documentReadingOrder);
}

/**
 * Arcs entre des nœuds, dans leur ordre : `child_of` (section → section parente) ou `member_of`
 * (autre nœud → section parente), puis `follows` (entrée → entrée suivante du volume). Un arc
 * n'est gardé que si ses deux bouts sont parmi les nœuds : deux entrées entre lesquelles le
 * volume en compte une autre ne sont pas reliées.
 */
export function inducedArcs(
  nodes: readonly Pick<SubgraphNode, "id" | "kind" | "parentId">[],
  nextEntry: ReadonlyMap<string, string>,
): Arc[] {
  const ids = new Set(nodes.map((n) => n.id));
  return nodes.flatMap((n): Arc[] => {
    const arcs: Arc[] = [];
    if (n.parentId !== null && ids.has(n.parentId)) {
      const kind = n.kind === "section" ? "child_of" : "member_of";
      arcs.push({ source: n.id, target: n.parentId, kind });
    }
    const next = nextEntry.get(n.id);
    if (next !== undefined && ids.has(next))
      arcs.push({ source: n.id, target: next, kind: "follows" });
    return arcs;
  });
}

/** Sous-graphe induit par les nœuds que désigne la requête dans ce volume. */
export function resolve(volume: LoadedVolume, query: Query): Subgraph {
  const nodes = selection(volume, query);
  return { nodes, arcs: inducedArcs(nodes, volume.nextEntry) };
}
