// Résolution d'une requête sur un volume chargé (docs/SCENARIOS.md, docs/MODELE_DONNEES.md) :
// la sélection en sous-graphe induit, son contexte, et la fiche d'un nœud. Plusieurs volumes :
// lib/query/explore.ts. Fonctions pures.

import { fold } from "./fold.ts";
import type { Query } from "./query.ts";
import type { Arc, Subgraph, SubgraphNode } from "./types.ts";
import type { LoadedVolume } from "./volume.ts";

/** Le nœud désigné par la requête n'existe pas. */
export class NodeNotFoundError extends Error {
  override name = "NodeNotFoundError";
  readonly nodeId: string;

  constructor(nodeId: string) {
    super(`nœud inconnu : ${nodeId}`);
    this.nodeId = nodeId;
  }
}

/** Nœud sélectionné, sans ses empans ni ses ancres, avec l'entrée qui le suit dans son volume
 * (null hors entrées). */
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

/** Le texte plié du nœud contient-il le texte cherché, plié (phrase entière, à la lettre) ? */
export function matcher(text: string | undefined): (volume: LoadedVolume, i: number) => boolean {
  if (text === undefined) return () => true;
  const needle = fold(text);
  return (volume, i) => volume.folded[i]?.includes(needle) ?? false;
}

/**
 * Nœuds que désigne la requête, dans l'ordre de lecture : conjonction de ses critères ; sans
 * critère, rien. Sous-arbre : les nœuds désignés et tous leurs descendants (un nœud désigné qui
 * n'est pas de ce volume n'y désigne rien).
 */
function selection(volume: LoadedVolume, { subtree, text }: Query): SubgraphNode[] {
  if (subtree === undefined && text === undefined) return [];
  const roots = new Set(subtree);
  // un nœud est dans l'union des sous-arbres s'il en est une racine ou si un ancêtre l'est
  const inside = new Map<string, boolean>();
  const isInside = (n: SubgraphNode): boolean => {
    let result = inside.get(n.id);
    if (result === undefined) {
      const parent = n.parentId === null ? undefined : volume.byId.get(n.parentId);
      result = roots.has(n.id) || (parent !== undefined && isInside(parent));
      inside.set(n.id, result);
    }
    return result;
  };
  const matches = matcher(text);
  return volume.nodes.filter(
    (n, i) => matches(volume, i) && (subtree === undefined || isInside(n)),
  );
}

/** Sous-graphe induit par les nœuds que désigne la requête dans ce volume. */
export function resolve(volume: LoadedVolume, query: Query): Subgraph {
  const nodes = selection(volume, query);
  const rows: SelectedNode[] = nodes.map(({ spans: _, anchors: __, ...n }) => ({
    ...n,
    nextEntryId: volume.nextEntry.get(n.id) ?? null,
  }));
  return { nodes, arcs: inducedArcs(rows) };
}

/**
 * Contexte de la sélection : les rubriques ancêtres de ses nœuds qui n'en font pas partie,
 * chacune une fois, dans l'ordre de lecture. Montrées comme la sélection, mais à part : le
 * contexte l'entoure sans en faire partie (docs/DESIGN.md, « Principes d'affichage »).
 */
export function context(volume: LoadedVolume, query: Query): SubgraphNode[] {
  const selected = selection(volume, query);
  const ids = new Set(selected.map((n) => n.id));
  const ancestors = new Set<SubgraphNode>();
  for (const n of selected) {
    for (let a = n.parentId; a !== null; ) {
      const parent = volume.byId.get(a);
      if (parent === undefined || ancestors.has(parent)) break;
      if (!ids.has(parent.id)) ancestors.add(parent);
      a = parent.parentId;
    }
  }
  return [...ancestors].sort((a, b) => a.documentReadingOrder - b.documentReadingOrder);
}

/** Fiche d'un nœud : le nœud, et le chemin de ses rubriques, de la racine à son parent (son fil
 * d'Ariane : leur texte seul). */
export function detail(
  volume: LoadedVolume,
  id: string,
): { node: SubgraphNode; path: Pick<SubgraphNode, "id" | "text">[] } {
  const node = volume.byId.get(id);
  if (node === undefined) throw new NodeNotFoundError(id);
  const path: Pick<SubgraphNode, "id" | "text">[] = [];
  for (let a = node.parentId; a !== null; ) {
    const parent = volume.byId.get(a);
    if (parent === undefined) break;
    path.unshift({ id: parent.id, text: parent.text });
    a = parent.parentId;
  }
  return { node, path };
}
