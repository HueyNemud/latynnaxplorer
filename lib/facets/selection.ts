// Coches des facettes de structure (docs/composants/facettes.md), en fonctions pures, sans état
// ni rendu : components/Facets.tsx les appelle. Une coche est l'identifiant d'une rubrique ;
// seules les plus hautes sont gardées, leurs descendants sont couverts.

import type { FacetSection } from "../query/types.ts";

/** Arbre des rubriques : chaque rubrique ; enfants de chaque rubrique, et rubriques de premier
 * niveau de chaque volume (clé : l'identifiant du volume), dans l'ordre de lecture. */
export interface SectionTree {
  byId: ReadonlyMap<string, FacetSection>;
  children: ReadonlyMap<string, FacetSection[]>;
}

export function sectionTree(sections: readonly FacetSection[]): SectionTree {
  return {
    byId: new Map(sections.map((s) => [s.id, s])),
    children: Map.groupBy(sections, (s) => s.parentId ?? s.volumeId),
  };
}

/** Rubriques au-dessus de `id`, de son parent à la racine. */
function* ancestors(tree: SectionTree, id: string): Generator<string> {
  for (let p = tree.byId.get(id)?.parentId; p; p = tree.byId.get(p)?.parentId) yield p;
}

/** Les coches de l'URL : seulement des rubriques (un `subtree` d'un autre nœud ne coche rien). */
export function checkedOf(tree: SectionTree, subtree: readonly string[]): Set<string> {
  return new Set(subtree.filter((id) => tree.byId.has(id)));
}

/** Rubrique couverte : une rubrique au-dessus d'elle est cochée. */
export function isCovered(tree: SectionTree, checked: ReadonlySet<string>, id: string): boolean {
  for (const p of ancestors(tree, id)) if (checked.has(p)) return true;
  return false;
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

/** Un volume est sélectionné si une de ses rubriques au moins est cochée. */
export function isVolumeSelected(
  tree: SectionTree,
  checked: ReadonlySet<string>,
  volumeId: string,
): boolean {
  for (const id of checked) if (tree.byId.get(id)?.volumeId === volumeId) return true;
  return false;
}

/** Tout le volume (ses rubriques de premier niveau), ou plus rien. */
export function toggleVolume(
  tree: SectionTree,
  checked: ReadonlySet<string>,
  volumeId: string,
): Set<string> {
  const selected = isVolumeSelected(tree, checked, volumeId);
  const next = new Set([...checked].filter((id) => tree.byId.get(id)?.volumeId !== volumeId));
  if (!selected) for (const s of tree.children.get(volumeId) ?? []) next.add(s.id);
  return next;
}

/** Mêmes coches : rien à appliquer. */
export function sameChecks(a: ReadonlySet<string>, b: ReadonlySet<string>): boolean {
  return a.size === b.size && [...a].every((id) => b.has(id));
}

/** Rubriques à déplier pour montrer les coches : celles au-dessus de chacune. */
export function pathTo(tree: SectionTree, checked: ReadonlySet<string>): Set<string> {
  const path = new Set<string>();
  for (const id of checked) for (const p of ancestors(tree, id)) path.add(p);
  return path;
}
