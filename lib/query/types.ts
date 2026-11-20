// Formes des données que rendent les requêtes (lib/query/resolve.ts, lib/query/facets.ts),
// partagées avec les composants : des types seuls.

export type NodeKind = "entry" | "section" | "out_of_scope";
export type ArcKind = "member_of" | "child_of" | "follows";
/** sujet, description, adresse */
export type SpanLabel = "SUBJ" | "DESC" | "ADDR";

/** Champ structuré d'une entrée ; positions dans `text` brut, en points de code, fin exclue. */
export interface Span {
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

/** Fiche d'un nœud : le nœud, et ses rubriques de la racine à son parent (son fil d'Ariane). */
export interface Detail {
  node: SubgraphNode;
  path: SubgraphNode[];
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
