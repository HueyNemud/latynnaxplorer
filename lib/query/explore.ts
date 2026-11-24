// Exploration de plusieurs volumes, chargés à la demande : quels volumes une requête demande ;
// ce qu'elle donne sur les volumes chargés, commun à toutes les vues ; le contexte de ce qu'une
// vue montre. Fonctions pures.

import { sections } from "./facets.ts";
import type { Query } from "./query.ts";
import { context, NodeNotFoundError, selection } from "./resolve.ts";
import type { FacetSection, SubgraphNode, Volume } from "./types.ts";
import type { LoadedVolume } from "./volume.ts";

/**
 * Volumes dont la requête a besoin : tous si elle n'a pas de rubrique (elle porte alors sur tous
 * les volumes) ou si l'un de ses sous-arbres n'est dans aucun volume chargé (l'URL ne dit pas de
 * quel volume il est) ; sinon celui que l'on regarde. `all` : les volumes de l'index, dans son
 * ordre.
 */
export function neededVolumes<V extends Volume>(
  all: readonly V[],
  loaded: readonly LoadedVolume[],
  query: Query,
  focus: string | undefined,
): V[] {
  const unplaced = query.subtree?.some((id) => volumeOf(loaded, id) === undefined);
  if (query.subtree === undefined || unplaced) return [...all];
  return all.filter((v) => v.id === focus);
}

/** Volume chargé qui contient le nœud. */
export function volumeOf(
  loaded: readonly LoadedVolume[],
  id: string | undefined,
): LoadedVolume | undefined {
  return id === undefined ? undefined : loaded.find((v) => v.byId.has(id));
}

/** Ce que la requête donne, commun à toutes les vues ; chacune n'en montre qu'une part. */
export interface Exploration {
  /** les nœuds sélectionnés, volume après volume, chacun dans l'ordre de lecture */
  selection: SubgraphNode[];
  /** les rubriques des volumes chargés, avec leurs décomptes pour le texte cherché */
  sections: FacetSection[];
}

/**
 * La requête sur les volumes chargés, mis bout à bout dans l'ordre de l'index. Un sous-arbre qui
 * n'est dans aucun d'eux est une erreur : à n'appeler qu'une fois chargés ceux que demande
 * neededVolumes.
 */
export function explore(loaded: readonly LoadedVolume[], query: Query): Exploration {
  const unknown = query.subtree?.find((id) => volumeOf(loaded, id) === undefined);
  if (unknown !== undefined) throw new NodeNotFoundError(unknown);
  return {
    selection: loaded.flatMap((volume) => selection(volume, query)),
    sections: loaded.flatMap((volume) => sections(volume, query)),
  };
}

/**
 * Des nœuds des volumes chargés (une part de la sélection) et leur contexte (rubriques ancêtres
 * qui n'en sont pas), à montrer ensemble : volume après volume, chacun dans l'ordre de lecture.
 */
export function withContext(
  loaded: readonly LoadedVolume[],
  nodes: readonly SubgraphNode[],
): SubgraphNode[] {
  return loaded.flatMap((volume) => {
    const own = nodes.filter((n) => volume.byId.get(n.id) === n);
    return [...context(volume, own), ...own].sort(
      (a, b) => a.documentReadingOrder - b.documentReadingOrder,
    );
  });
}
