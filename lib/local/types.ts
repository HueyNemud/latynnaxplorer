// Essai des données en local : le fichier d'un volume, téléchargé par le navigateur, qui y
// résout les requêtes sans serveur. Écrit par scripts/export-volume.ts.

import type { FacetVolume, SubgraphNode } from "../query/types.ts";

export interface VolumeFile {
  volume: FacetVolume;
  /** Tous les nœuds du volume dans l'ordre de lecture, avec leurs empans et leurs ancres. */
  nodes: SubgraphNode[];
}
