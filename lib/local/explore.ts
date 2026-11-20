// Exploration de plusieurs volumes, chargés à la demande : quels volumes une requête demande,
// et sa vue sur les volumes chargés (sélection, contexte et facettes de chacun, mis bout à
// bout dans l'ordre de l'index). Fonctions pures.

import type { Query } from "../query/query.ts";
import { NodeNotFoundError } from "../query/resolve.ts";
import type { FacetSection, SubgraphNode } from "../query/types.ts";
import { contextLocal, facetsLocal, type LocalVolume, resolveLocal } from "./engine.ts";

/**
 * Volumes dont la requête a besoin : celui que l'on regarde ; tous si elle cherche un texte sans
 * rubrique (tout l'annuaire), ou si l'un de ses sous-arbres n'est dans aucun volume chargé (l'URL
 * ne dit pas de quel volume il est). `all` : les volumes de l'index, dans son ordre.
 */
export function neededVolumes(
  all: readonly string[],
  loaded: readonly LocalVolume[],
  query: Query,
  focus: string | undefined,
): string[] {
  const searchesAll = query.text !== undefined && query.subtree === undefined;
  const unplaced = query.subtree?.some((id) => !loaded.some((v) => v.byId.has(id)));
  if (searchesAll || unplaced) return [...all];
  return focus === undefined ? [] : [focus];
}

/** Volume chargé qui contient le nœud. */
export function volumeOf(
  loaded: readonly LocalVolume[],
  id: string | undefined,
): LocalVolume | undefined {
  return id === undefined ? undefined : loaded.find((v) => v.byId.has(id));
}

export interface View {
  /** les nœuds sélectionnés, volume après volume, chacun dans l'ordre de lecture */
  selection: SubgraphNode[];
  /** la sélection et son contexte (rubriques ancêtres), à montrer ensemble, dans le même ordre */
  shown: SubgraphNode[];
  /** les rubriques des volumes chargés, avec leurs décomptes pour le texte cherché */
  sections: FacetSection[];
}

/**
 * Vue de la requête sur les volumes chargés, dans l'ordre de l'index. Un sous-arbre qui n'est
 * dans aucun d'eux est une erreur : à n'appeler qu'une fois chargés ceux que demande
 * neededVolumes.
 */
export function view(loaded: readonly LocalVolume[], query: Query): View {
  const unknown = query.subtree?.find((id) => volumeOf(loaded, id) === undefined);
  if (unknown !== undefined) throw new NodeNotFoundError(unknown);
  const result: View = { selection: [], shown: [], sections: [] };
  for (const volume of loaded) {
    const { nodes } = resolveLocal(volume, query);
    result.selection.push(...nodes);
    result.shown.push(
      ...[...contextLocal(volume, query), ...nodes].sort(
        (a, b) => a.documentReadingOrder - b.documentReadingOrder,
      ),
    );
    result.sections.push(...facetsLocal(volume, query).sections);
  }
  return result;
}
