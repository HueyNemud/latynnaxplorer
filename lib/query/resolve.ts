// Résolution d'une requête sur un volume chargé (docs/SCENARIOS.md) : la sélection et son
// contexte. Fonctions pures.

import { fold } from "./fold.ts";
import type { Query } from "./query.ts";
import type { SubgraphNode } from "./types.ts";
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
 * Nœuds que désigne la requête, dans l'ordre de lecture : conjonction de ses critères, dont un
 * critère absent ne filtre rien (sans critère, tout le volume). Sous-arbre : les nœuds désignés et
 * tous leurs descendants (un nœud désigné qui n'est pas de ce volume n'y désigne rien).
 */
export function selection(volume: LoadedVolume, query: Query): SubgraphNode[] {
  const { subtree } = query;
  const designated = new Set(subtree);
  const inSubtree = (n: SubgraphNode) => {
    if (designated.has(n.id)) return true;
    for (const a of ancestors(volume, n)) if (designated.has(a.id)) return true;
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
