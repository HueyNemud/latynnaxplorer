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

/** Rubrique couverte : la rubrique cochée au-dessus d'elle qui la couvre, s'il y en a une. */
export function coveredBy(
  tree: SectionTree,
  checked: ReadonlySet<string>,
  id: string,
): string | undefined {
  for (const p of ancestors(tree, id)) if (checked.has(p)) return p;
  return undefined;
}

/** Ne garder que cette rubrique couverte : la rubrique qui la couvre est décochée, elle seule est
 * cochée à sa place ; les autres coches ne changent pas. */
export function keepOnly(tree: SectionTree, checked: ReadonlySet<string>, id: string): Set<string> {
  const next = new Set(checked);
  for (const p of ancestors(tree, id)) next.delete(p);
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

/** Un volume est sélectionné si une de ses rubriques au moins est cochée. */
export function isVolumeSelected(
  tree: SectionTree,
  checked: ReadonlySet<string>,
  volumeId: string,
): boolean {
  for (const id of checked) if (tree.byId.get(id)?.volumeId === volumeId) return true;
  return false;
}

/** Tout le volume est sélectionné : toutes ses rubriques de premier niveau sont cochées. */
export function isVolumeFull(
  tree: SectionTree,
  checked: ReadonlySet<string>,
  volumeId: string,
): boolean {
  return (tree.children.get(volumeId) ?? []).every((s) => checked.has(s.id));
}

/** Tout le volume (ses rubriques de premier niveau), ou plus rien ; les autres volumes ne
 * changent pas. */
export function setVolume(
  tree: SectionTree,
  checked: ReadonlySet<string>,
  volumeId: string,
  all: boolean,
): Set<string> {
  const next = new Set([...checked].filter((id) => tree.byId.get(id)?.volumeId !== volumeId));
  if (all) for (const s of tree.children.get(volumeId) ?? []) next.add(s.id);
  return next;
}

/** État de la coche d'un volume : entier, en partie (une partie de ses rubriques), ou rien. */
export function volumeState(
  tree: SectionTree,
  checked: ReadonlySet<string>,
  volumeId: string,
): boolean | "indeterminate" {
  if (isVolumeFull(tree, checked, volumeId)) return true;
  return isVolumeSelected(tree, checked, volumeId) && "indeterminate";
}

/** La coche ronde d'un volume : tout le volume s'il ne l'est pas entier (rien ou en partie),
 * sinon plus rien. */
export function toggleVolume(
  tree: SectionTree,
  checked: ReadonlySet<string>,
  volumeId: string,
): Set<string> {
  return setVolume(tree, checked, volumeId, !isVolumeFull(tree, checked, volumeId));
}

/** Rubriques au-dessus des coches : à déplier à l'arrivée pour les montrer ; semi-sélectionnées
 * (une rubrique en dessous d'elles est cochée). */
export function pathTo(tree: SectionTree, checked: ReadonlySet<string>): Set<string> {
  const path = new Set<string>();
  for (const id of checked) for (const p of ancestors(tree, id)) path.add(p);
  return path;
}
