// Formes des données que rendent les requêtes (lib/query/resolve.ts, lib/query/facets.ts),
// partagées avec les composants : des types seuls, sans SQL.

import type { nodeKind, spanLabel } from "../db/schema.ts";

export type NodeKind = (typeof nodeKind.enumValues)[number];
export type ArcKind = "member_of" | "child_of" | "follows";
export type SpanLabel = (typeof spanLabel.enumValues)[number];

/** Champ structuré d'une entrée ; positions dans `text` brut, en points de code, fin exclue. */
export interface Span {
  id: string;
  label: SpanLabel;
  charStart: number;
  charEnd: number;
  normalized: string;
}

/** Boîte du nœud sur une page du PDF (repère numrev 0–1000, origine en haut à gauche). */
export interface Anchor {
  page: number;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface SubgraphNode {
  id: string;
  kind: NodeKind;
  parentId: string | null;
  documentReadingOrder: number;
  text: string;
  /** Dans l'ordre du texte ; vide hors entrées. */
  spans: Span[];
  /** Dans l'ordre des pages ; vide si le nœud n'a aucune ligne boîtée. */
  anchors: Anchor[];
}

export interface Arc {
  source: string;
  target: string;
  kind: ArcKind;
}

/** Nœuds dans l'ordre de lecture ; arcs dont les deux bouts sont parmi ces nœuds. */
export interface Subgraph {
  nodes: SubgraphNode[];
  arcs: Arc[];
}

export interface FacetVolume {
  /** dc:identifier, ex. « 1807_AD75-PER292 » */
  id: string;
  /** dc:title ; null tant qu'il n'est pas renseigné */
  title: string | null;
  /** début de dcterms:temporal, AAAA-MM-JJ */
  temporalStart: string;
}

export interface FacetSection {
  id: string;
  /** rubrique parente ; null au premier niveau du volume */
  parentId: string | null;
  volumeId: string;
  /** intitulé tel que numrev le donne */
  text: string;
  /** entrées du sous-arbre, la rubrique comprise, qui contiennent le texte cherché s'il y en a un */
  entries: number;
}

export interface Facets {
  /** dans l'ordre des dates */
  volumes: FacetVolume[];
  /** par volume, dans l'ordre de lecture : un parent vient avant ses enfants */
  sections: FacetSection[];
}
