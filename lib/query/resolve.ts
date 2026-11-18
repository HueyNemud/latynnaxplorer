// Résolution d'une requête en sous-graphe induit (docs/MODELE_DONNEES.md, section 3) :
// une requête SQL sélectionne les nœuds, puis les arcs entre eux sont déduits de leurs colonnes.

import type postgres from "postgres";
import type { nodeKind } from "../db/schema.ts";
import type { Query } from "./query.ts";

export type NodeKind = (typeof nodeKind.enumValues)[number];
export type ArcKind = "member_of" | "child_of" | "follows";

export interface SubgraphNode {
  id: string;
  kind: NodeKind;
  parentId: string | null;
  documentReadingOrder: number;
  text: string;
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

/** Nœud sélectionné, avec l'entrée qui le suit dans son volume (null hors entrées). */
export interface SelectedNode extends SubgraphNode {
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

/** Sous-graphe induit par le nœud `query.subtree` et tous ses descendants. */
export async function resolve(sql: postgres.Sql, query: Query): Promise<Subgraph> {
  // Sous-arbre sans parcours : le nœud lui-même, plus les enfants de chacun de ses nœuds
  // parents descendants, lus dans parent_closure (vide si le nœud n'a pas d'enfant). UNION ALL
  // plutôt que OR : chaque branche garde son index. Les trois arcs sont portés par des
  // colonnes (parent_id, next_entry_id) : rien à calculer en SQL.
  // Mesures : docs/MODELE_DONNEES.md, section 4.
  const rows = await sql<SelectedNode[]>`
    SELECT id, kind, parent_id AS "parentId", document_reading_order AS "documentReadingOrder",
           text, next_entry_id AS "nextEntryId"
    FROM node WHERE id = ${query.subtree}
    UNION ALL
    SELECT n.id, n.kind, n.parent_id, n.document_reading_order, n.text, n.next_entry_id
    FROM parent_closure c JOIN node n ON n.parent_id = c.descendant_id
    WHERE c.ancestor_id = ${query.subtree}
    ORDER BY "documentReadingOrder"`;
  if (rows.length === 0) throw new NodeNotFoundError(query.subtree);
  return {
    nodes: rows.map(({ nextEntryId: _, ...node }) => node),
    arcs: inducedArcs(rows),
  };
}
