// Exploration du volume interrogé : ce que la requête y donne, commun à toutes les vues ; le
// contexte de ce qu'une vue montre. Fonctions pures.

import { sections } from "./facets.ts";
import type { Query } from "./query.ts";
import { context, NodeNotFoundError, selection } from "./resolve.ts";
import type { FacetSection, SubgraphNode } from "./types.ts";
import type { LoadedVolume } from "./volume.ts";

/** Ce que la requête donne, commun à toutes les vues ; chacune n'en montre qu'une part. */
export interface Exploration {
  /** les nœuds sélectionnés, dans l'ordre de lecture */
  selection: SubgraphNode[];
  /** les rubriques du volume, avec leurs décomptes pour le texte cherché */
  sections: FacetSection[];
}

/** La requête sur le volume. Un sous-arbre qui n'est pas dans ce volume est une erreur. */
export function explore(volume: LoadedVolume, query: Query): Exploration {
  const unknown = query.subtree?.find((id) => !volume.byId.has(id));
  if (unknown !== undefined) throw new NodeNotFoundError(unknown);
  return { selection: selection(volume, query), sections: sections(volume, query) };
}

/**
 * Des nœuds du volume (une part de la sélection) et leur contexte (rubriques ancêtres qui n'en
 * sont pas), à montrer ensemble dans l'ordre de lecture.
 */
export function withContext(volume: LoadedVolume, nodes: readonly SubgraphNode[]): SubgraphNode[] {
  return [...context(volume, nodes), ...nodes].sort(
    (a, b) => a.documentReadingOrder - b.documentReadingOrder,
  );
}
