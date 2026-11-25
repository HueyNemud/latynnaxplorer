// Facettes de structure (docs/DESIGN.md, « Facettes » ; docs/composants/facettes.md) : l'arbre
// des rubriques d'un volume, avec le nombre d'entrées de chaque sous-arbre, compte tenu du texte
// cherché et de ses zones (pas des rubriques cochées : le décompte dit ce que l'on obtiendrait
// en cochant la rubrique).

import type { Query } from "./query.ts";
import { matcher } from "./resolve.ts";
import type { FacetSection } from "./types.ts";
import { ancestors, type LoadedVolume } from "./volume.ts";

/** Les rubriques du volume, dans l'ordre de lecture (un parent avant ses enfants), avec leurs
 * décomptes d'entrées. */
export function sections(
  volume: LoadedVolume,
  query: Pick<Query, "text" | "zones">,
): FacetSection[] {
  const matches = matcher(volume, query);
  const entries = new Map<string, number>();
  volume.nodes.forEach((n, i) => {
    if (n.kind !== "entry" || !matches(i)) return;
    for (const a of ancestors(volume, n)) entries.set(a.id, (entries.get(a.id) ?? 0) + 1);
  });
  return volume.nodes
    .filter((n) => n.kind === "section")
    .map((n) => ({
      id: n.id,
      parentId: n.parentId,
      text: n.text,
      entries: entries.get(n.id) ?? 0,
    }));
}
