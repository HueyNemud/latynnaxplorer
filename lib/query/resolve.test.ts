// Scénario 1 (docs/SCENARIOS.md) sur la fixture : T1 ⊃ { E3, T2 ⊃ { E1, E2, O1 } }, dans
// l'ordre de lecture T1, E3, T2, E1, E2, O1 (scripts/fixture.ts).

import { afterAll, describe, expect, inject, it } from "vitest";
import { E1, E2, E3, O1, T1, T2 } from "../../scripts/fixture.ts";
import { connect } from "../db/client.ts";
import { inducedArcs, NodeNotFoundError, resolve, type SelectedNode } from "./resolve.ts";

const sql = connect(inject("databaseUrl"));
afterAll(() => sql.end());

describe("resolve, sous-arbre", () => {
  it("rend le nœud, ses descendants et les arcs entre eux, dans l'ordre de lecture", async () => {
    expect(await resolve(sql, { subtree: T2 })).toEqual({
      nodes: [
        { id: T2, kind: "section", parentId: T1, documentReadingOrder: 2, text: "RUBRIQUE." },
        {
          id: E1,
          kind: "entry",
          parentId: T2,
          documentReadingOrder: 3,
          text: "Dupont, rue de la Paix, 12.",
        },
        {
          id: E2,
          kind: "entry",
          parentId: T2,
          documentReadingOrder: 4,
          text: "Martin, rue Longue, 3.",
        },
        { id: O1, kind: "out_of_scope", parentId: T2, documentReadingOrder: 5, text: "ALMANACH" },
      ],
      // ni T2 → T1 ni E3 → E1 : T1 et E3 sont hors du sous-arbre
      arcs: [
        { source: E1, target: T2, kind: "member_of" },
        { source: E1, target: E2, kind: "follows" },
        { source: E2, target: T2, kind: "member_of" },
        { source: O1, target: T2, kind: "member_of" },
      ],
    });
  });

  it("descend récursivement dans les sous-rubriques", async () => {
    const { nodes, arcs } = await resolve(sql, { subtree: T1 });
    expect(nodes.map((n) => n.id)).toEqual([T1, E3, T2, E1, E2, O1]);
    expect(arcs).toEqual([
      { source: E3, target: T1, kind: "member_of" },
      { source: E3, target: E1, kind: "follows" },
      { source: T2, target: T1, kind: "child_of" },
      { source: E1, target: T2, kind: "member_of" },
      { source: E1, target: E2, kind: "follows" },
      { source: E2, target: T2, kind: "member_of" },
      { source: O1, target: T2, kind: "member_of" },
    ]);
  });

  it("réduit le sous-arbre d'une entrée à l'entrée seule", async () => {
    const { nodes, arcs } = await resolve(sql, { subtree: E1 });
    expect(nodes.map((n) => n.id)).toEqual([E1]);
    expect(arcs).toEqual([]);
  });

  it("refuse un nœud inconnu", async () => {
    const unknown = "99999999-0000-0000-0000-000000000000";
    await expect(resolve(sql, { subtree: unknown })).rejects.toThrow(NodeNotFoundError);
  });
});

describe("inducedArcs", () => {
  const entry = (id: string, order: number, nextEntryId: string | null): SelectedNode => ({
    id,
    kind: "entry",
    parentId: null,
    documentReadingOrder: order,
    text: id,
    nextEntryId,
  });

  it("ne relie pas deux entrées sélectionnées séparées par une entrée qui ne l'est pas", () => {
    // volume A, B, C ; sélection A, C
    expect(inducedArcs([entry("A", 0, "B"), entry("C", 2, null)])).toEqual([]);
  });
});
