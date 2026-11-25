// Cases des facettes de structure (docs/composants/facettes.md), en fonctions pures, sans état
// ni rendu : components/Facets.tsx les appelle. Les cases cochées sont un ensemble d'identifiants
// de rubriques ; seules les plus hautes sont gardées, leurs descendantes sont couvertes.

import type { FacetSection } from "../query/types.ts";
import { ancestors } from "../query/volume.ts";

/** Arbre des rubriques du volume : chaque rubrique ; enfants de chaque rubrique, et rubriques de
 * premier niveau (clé : null), dans l'ordre de lecture. */
export interface SectionTree {
  byId: ReadonlyMap<string, FacetSection>;
  children: ReadonlyMap<string | null, FacetSection[]>;
}

export function sectionTree(sections: readonly FacetSection[]): SectionTree {
  return {
    byId: new Map(sections.map((s) => [s.id, s])),
    children: Map.groupBy(sections, (s) => s.parentId),
  };
}

/** Rubriques au-dessus de `id`, de son parent à la racine. */
const above = (tree: SectionTree, id: string) => ancestors(tree, tree.byId.get(id));

/** Les rubriques cochées de l'URL (un `subtree` d'un autre nœud ne coche rien). */
export function checkedOf(tree: SectionTree, subtree: readonly string[]): Set<string> {
  return new Set(subtree.filter((id) => tree.byId.has(id)));
}

/** Rubrique couverte : la rubrique cochée au-dessus d'elle qui la couvre, s'il y en a une. */
export function coveredBy(
  tree: SectionTree,
  checked: ReadonlySet<string>,
  id: string,
): FacetSection | undefined {
  for (const p of above(tree, id)) if (checked.has(p.id)) return p;
  return undefined;
}

/** Ne garder que cette rubrique couverte : la rubrique qui la couvre est décochée, elle seule est
 * cochée à sa place ; les autres cases ne changent pas. */
export function keepOnly(tree: SectionTree, checked: ReadonlySet<string>, id: string): Set<string> {
  const next = new Set(checked);
  for (const p of above(tree, id)) next.delete(p.id);
  next.add(id);
  return next;
}

/** Cocher ou décocher une rubrique. Cochée, elle couvre tout son sous-arbre : ses descendants
 * ne sont plus gardés. */
export function toggleSection(
  tree: SectionTree,
  checked: ReadonlySet<string>,
  id: string,
): Set<string> {
  const next = new Set(checked);
  if (next.has(id)) next.delete(id);
  else {
    next.add(id);
    const stack = [...(tree.children.get(id) ?? [])];
    for (let s = stack.pop(); s; s = stack.pop()) {
      next.delete(s.id);
      stack.push(...(tree.children.get(s.id) ?? []));
    }
  }
  return next;
}

/** Tout le volume est sélectionné : toutes ses rubriques de premier niveau sont cochées. */
function isVolumeFull(tree: SectionTree, checked: ReadonlySet<string>): boolean {
  return (tree.children.get(null) ?? []).every((s) => checked.has(s.id));
}

/** État de la case ronde : volume entier, en partie (une partie de ses rubriques), ou rien. */
export function volumeState(
  tree: SectionTree,
  checked: ReadonlySet<string>,
): boolean | "indeterminate" {
  if (isVolumeFull(tree, checked)) return true;
  return checked.size > 0 && "indeterminate";
}

/** La case ronde : tout le volume (ses rubriques de premier niveau) s'il ne l'est pas entier,
 * sinon plus rien. */
export function toggleVolume(tree: SectionTree, checked: ReadonlySet<string>): Set<string> {
  if (isVolumeFull(tree, checked)) return new Set();
  return new Set((tree.children.get(null) ?? []).map((s) => s.id));
}

/** Rubriques au-dessus des rubriques cochées : à déplier à l'arrivée pour les montrer ; cochées
 * en partie (une rubrique en dessous d'elles est cochée). */
export function pathTo(tree: SectionTree, checked: ReadonlySet<string>): Set<string> {
  const path = new Set<string>();
  for (const id of checked) for (const p of above(tree, id)) path.add(p.id);
  return path;
}
