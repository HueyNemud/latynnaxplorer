// Résolution d'une requête en sous-graphe induit (docs/MODELE_DONNEES.md, section 3) :
// SQL sélectionne les nœuds (avec leurs empans et leurs ancres), puis les arcs entre eux sont
// déduits de leurs colonnes. Le contexte de la sélection (rubriques ancêtres) est lu à part.

import type postgres from "postgres";
import type { nodeKind, spanLabel } from "../db/schema.ts";
import type { Query } from "./query.ts";

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

/** Le nœud désigné par la requête n'existe pas. */
export class NodeNotFoundError extends Error {
  override name = "NodeNotFoundError";
  readonly nodeId: string;

  constructor(nodeId: string) {
    super(`nœud inconnu : ${nodeId}`);
    this.nodeId = nodeId;
  }
}

/** Nœud sélectionné, tel que lu dans `node` : sans ses empans ni ses ancres, avec l'entrée qui le
 * suit dans son volume (null hors entrées). */
export interface SelectedNode extends Omit<SubgraphNode, "spans" | "anchors"> {
  nextEntryId: string | null;
}

/**
 * Arcs du sous-graphe induit, dans l'ordre des nœuds : `child_of` (section → section parente)
 * ou `member_of` (autre nœud → section parente), puis `follows` (entrée → entrée suivante du
 * volume). Un arc n'est gardé que si ses deux bouts sont sélectionnés : deux entrées
 * sélectionnées entre lesquelles le volume en compte une autre ne sont pas reliées.
 */
export function inducedArcs(nodes: SelectedNode[]): Arc[] {
  const selected = new Set(nodes.map((n) => n.id));
  return nodes.flatMap((n): Arc[] => {
    const arcs: Arc[] = [];
    if (n.parentId !== null && selected.has(n.parentId)) {
      const kind = n.kind === "section" ? "child_of" : "member_of";
      arcs.push({ source: n.id, target: n.parentId, kind });
    }
    if (n.nextEntryId !== null && selected.has(n.nextEntryId)) {
      arcs.push({ source: n.id, target: n.nextEntryId, kind: "follows" });
    }
    return arcs;
  });
}

/**
 * Nœuds que désigne la requête, avec les colonnes de `node` qui portent les trois arcs
 * (parent_id, next_entry_id) : rien à calculer en SQL. Sous-arbre sans parcours (scénario 1) :
 * le nœud lui-même, plus les enfants de chacun de ses nœuds parents descendants, lus dans
 * parent_closure (vide si le nœud n'a pas d'enfant) ; UNION ALL plutôt que OR : chaque branche
 * garde son index. Texte (scénario 2) : servi par l'index trigrammes de `node.text`, à condition
 * d'écrire l'expression indexée telle quelle.
 */
function selection(sql: postgres.Sql, { subtree, text }: Query) {
  const nodes =
    subtree === undefined
      ? sql`node`
      : sql`(
          SELECT * FROM node WHERE id = ${subtree}
          UNION ALL
          SELECT n.* FROM parent_closure c JOIN node n ON n.parent_id = c.descendant_id
          WHERE c.ancestor_id = ${subtree}
        )`;
  // Le texte cherché est pris tel quel : ses « % », « _ » et « \ » sont échappés pour ILIKE.
  const contains =
    text === undefined
      ? sql``
      : sql`WHERE immutable_unaccent(n.text)
              ILIKE '%' || immutable_unaccent(${text.replace(/[\\%_]/g, "\\$&")}) || '%'`;
  return sql`
    SELECT n.id, n.kind, n.parent_id, n.document_reading_order, n.text, n.next_entry_id
    FROM ${nodes} n ${contains}`;
}

/**
 * Sous-graphe induit par les nœuds que désigne la requête : conjonction de ses critères
 * (docs/SCENARIOS.md). Une sélection vide n'est pas une erreur ; un `subtree` inconnu, si.
 */
export async function resolve(sql: postgres.Sql, query: Query): Promise<Subgraph> {
  const selected = selection(sql, query);
  // Trois requêtes en parallèle, en lignes simples : nœuds, empans, ancres, rattachés ensuite en
  // TypeScript. Regrouper par nœud dans PostgreSQL (JSON ou tableaux) est deux fois plus lent.
  // Mesures : docs/MODELE_DONNEES.md, section 4.
  const [rows, spans, anchors] = await Promise.all([
    sql<SelectedNode[]>`
      SELECT id, kind, parent_id AS "parentId", document_reading_order AS "documentReadingOrder",
             text, next_entry_id AS "nextEntryId"
      FROM (${selected}) n
      ORDER BY document_reading_order`,
    sql<(Span & { nodeId: string })[]>`
      SELECT s.node_id AS "nodeId", s.id, s.label, s.char_start AS "charStart",
             s.char_end AS "charEnd", s.normalized
      FROM (${selected}) n JOIN span s ON s.node_id = n.id
      ORDER BY s.char_start, s.char_end`,
    sql<(Anchor & { nodeId: string })[]>`
      SELECT a.node_id AS "nodeId", a.page, a.x0, a.y0, a.x1, a.y1
      FROM (${selected}) n JOIN anchor a ON a.node_id = n.id
      ORDER BY a.page`,
  ]);
  if (rows.length === 0 && query.subtree !== undefined) {
    const [known] = await sql`SELECT 1 FROM node WHERE id = ${query.subtree}`;
    if (!known) throw new NodeNotFoundError(query.subtree);
  }
  const spansOf = groupByNode(spans);
  const anchorsOf = groupByNode(anchors);
  return {
    nodes: rows.map(({ nextEntryId: _, ...node }) => ({
      ...node,
      spans: spansOf.get(node.id) ?? [],
      anchors: anchorsOf.get(node.id) ?? [],
    })),
    arcs: inducedArcs(rows),
  };
}

/** Lignes regroupées par nœud, dans l'ordre où elles arrivent, sans leur colonne `nodeId`. */
function groupByNode<T extends { nodeId: string }>(rows: T[]): Map<string, Omit<T, "nodeId">[]> {
  const groups = new Map<string, Omit<T, "nodeId">[]>();
  for (const { nodeId, ...row } of rows) {
    const group = groups.get(nodeId);
    if (group) group.push(row);
    else groups.set(nodeId, [row]);
  }
  return groups;
}

/**
 * Contexte du nœud `query.subtree` : ses rubriques ancêtres, de la racine à son parent (vide
 * pour un nœud racine ou inconnu, `resolve` signalant l'inconnu ; vide aussi sans `subtree`). Des nœuds complets, comme ceux
 * du sous-graphe (une rubrique n'a pas d'empans), pour être montrés de la même façon ; mais
 * rendus à part : le contexte entoure la sélection sans en faire partie (docs/DESIGN.md,
 * « Principes d'affichage »). Rangées par profondeur, comptée dans parent_closure, et non par
 * ordre de lecture : aucune hypothèse sur la place d'un intitulé par rapport à son contenu.
 */
export async function context(sql: postgres.Sql, query: Query): Promise<SubgraphNode[]> {
  if (query.subtree === undefined) return [];
  const ancestors = sql`
    SELECT c.ancestor_id AS id
    FROM node n JOIN parent_closure c ON c.descendant_id = n.parent_id
    WHERE n.id = ${query.subtree}`;
  const [rows, anchors] = await Promise.all([
    sql<Omit<SubgraphNode, "spans" | "anchors">[]>`
      SELECT a.id, a.kind, a.parent_id AS "parentId",
             a.document_reading_order AS "documentReadingOrder", a.text
      FROM (${ancestors}) x JOIN node a ON a.id = x.id
      ORDER BY (SELECT count(*) FROM parent_closure d WHERE d.descendant_id = a.id)`,
    sql<(Anchor & { nodeId: string })[]>`
      SELECT a.node_id AS "nodeId", a.page, a.x0, a.y0, a.x1, a.y1
      FROM (${ancestors}) x JOIN anchor a ON a.node_id = x.id
      ORDER BY a.page`,
  ]);
  const anchorsOf = groupByNode(anchors);
  return rows.map((node) => ({ ...node, spans: [], anchors: anchorsOf.get(node.id) ?? [] }));
}
