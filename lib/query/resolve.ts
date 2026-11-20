// Résolution d'une requête en sous-graphe induit (docs/MODELE_DONNEES.md, section 3) :
// SQL sélectionne les nœuds (avec leurs empans et leurs ancres), puis les arcs entre eux sont
// déduits de leurs colonnes. Le contexte de la sélection (rubriques ancêtres) est lu à part.

import type postgres from "postgres";
import { contains } from "./contains.ts";
import type { Query } from "./query.ts";
import type { Anchor, Arc, Span, Subgraph, SubgraphNode } from "./types.ts";

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
 * (parent_id, next_entry_id) : rien à calculer en SQL. Chaque critère présent restreint la
 * sélection ; sans critère, tous les nœuds. Deux écritures, choisies pour l'index qui sert :
 *
 * - Avec un texte (scénario 2) : l'index trigrammes de `node.text` (expression écrite telle
 *   quelle), puis, s'il est donné, le sous-arbre. Partir du sous-arbre et le filtrer par le
 *   texte serait plus rapide au premier appel, mais PostgreSQL passe au plan générique des
 *   requêtes préparées après cinq appels, qui relit alors l'index pour chaque sous-rubrique :
 *   2 → 60 ms pour « rue de la paix » dans la plus grosse rubrique de 1807, contre 2 ms ici.
 * - Sans texte, le sous-arbre (scénario 1), sans parcours : les nœuds désignés, plus les
 *   enfants de chacun de leurs nœuds parents descendants, lus dans parent_closure (vide si le
 *   nœud n'a pas d'enfant) ; UNION plutôt que OR, qui lirait toute la table. UNION et non
 *   UNION ALL : deux nœuds désignés peuvent être l'un sous l'autre, chaque nœud ne doit venir
 *   qu'une fois (sur tout 1807, 43 rubriques : 11 ms contre 6).
 */
function selection(sql: postgres.Sql, { subtree, text }: Query) {
  const columns = sql`n.id, n.kind, n.parent_id, n.document_reading_order, n.text, n.next_entry_id`;
  if (text !== undefined) {
    const inSubtree =
      subtree === undefined
        ? sql``
        : sql`AND (n.id = ANY(${subtree}::uuid[]) OR n.parent_id IN (
            SELECT c.descendant_id FROM parent_closure c
            WHERE c.ancestor_id = ANY(${subtree}::uuid[])))`;
    return sql`
      SELECT ${columns} FROM node n
      WHERE ${contains(sql, sql`n.text`, text)}
        ${inSubtree}`;
  }
  // sans critère, rien n'est sélectionné
  if (subtree === undefined) return sql`SELECT ${columns} FROM node n WHERE false`;
  return sql`
    SELECT ${columns} FROM node n WHERE n.id = ANY(${subtree}::uuid[])
    UNION
    SELECT ${columns} FROM parent_closure c JOIN node n ON n.parent_id = c.descendant_id
    WHERE c.ancestor_id = ANY(${subtree}::uuid[])`;
}

/**
 * Sous-graphe induit par les nœuds que désigne la requête : conjonction de ses critères
 * (docs/SCENARIOS.md). Une sélection vide n'est pas une erreur ; un `subtree` inconnu, si, même
 * à côté d'autres connus.
 */
export async function resolve(sql: postgres.Sql, query: Query): Promise<Subgraph> {
  const selected = selection(sql, query);
  // Trois requêtes en parallèle, en lignes simples : nœuds, empans, ancres, rattachés ensuite en
  // TypeScript. Regrouper par nœud dans PostgreSQL (JSON ou tableaux) est deux fois plus lent.
  // Mesures : docs/MODELE_DONNEES.md, section 4.
  const [rows, spans, anchors, known] = await Promise.all([
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
    query.subtree === undefined
      ? []
      : sql<{ id: string }[]>`SELECT id FROM node WHERE id = ANY(${query.subtree}::uuid[])`,
  ]);
  const found = new Set(known.map((k) => k.id));
  const unknown = query.subtree?.find((id) => !found.has(id));
  if (unknown !== undefined) throw new NodeNotFoundError(unknown);
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
 * Contexte de la sélection : les rubriques ancêtres de ses nœuds qui n'en font pas partie,
 * chacune une fois, dans l'ordre de lecture, quels que soient les critères. Un sous-arbre seul
 * a pour contexte les rubriques au-dessus de son nœud, de la racine à son parent. Vide pour une
 * sélection vide. Des nœuds complets, comme ceux du sous-graphe (une rubrique n'a pas d'empans),
 * pour être montrés de la même façon ; mais rendus à part : le contexte entoure la sélection sans
 * en faire partie (docs/DESIGN.md, « Principes d'affichage »).
 */
export async function context(sql: postgres.Sql, query: Query): Promise<SubgraphNode[]> {
  // parent_closure relie aussi chaque nœud parent à lui-même : le parent est compris.
  const selected = selection(sql, query);
  const ancestors = sql`
    SELECT c.ancestor_id AS id
    FROM (${selected}) n JOIN parent_closure c ON c.descendant_id = n.parent_id
    EXCEPT
    SELECT id FROM (${selected}) n`;
  const [rows, anchors] = await Promise.all([
    sql<Omit<SubgraphNode, "spans" | "anchors">[]>`
      SELECT a.id, a.kind, a.parent_id AS "parentId",
             a.document_reading_order AS "documentReadingOrder", a.text
      FROM (${ancestors}) x JOIN node a ON a.id = x.id
      ORDER BY a.document_reading_order`,
    sql<(Anchor & { nodeId: string })[]>`
      SELECT a.node_id AS "nodeId", a.page, a.x0, a.y0, a.x1, a.y1
      FROM (${ancestors}) x JOIN anchor a ON a.node_id = x.id
      ORDER BY a.page`,
  ]);
  const anchorsOf = groupByNode(anchors);
  return rows.map((node) => ({ ...node, spans: [], anchors: anchorsOf.get(node.id) ?? [] }));
}
