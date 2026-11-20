// Scénarios 1 et 2 (docs/SCENARIOS.md) sur la fixture : T1 ⊃ { E3, T2 ⊃ { E1, E2, O1 } }, dans
// l'ordre de lecture T1, E3, T2, E1, E2, O1 (scripts/fixture.ts). E1 a deux empans, E2 est sur
// deux pages, E3 n'a pas d'ancre.

import { describe, expect, it } from "vitest";
import { E1, E2, E3, fixture, O1, T1, T2 } from "../../scripts/fixture.ts";
import { validateVolume } from "../../scripts/validate.ts";
import { toVolumeFile } from "../../scripts/volume-file.ts";
import type { Query } from "./query.ts";
import {
  context,
  detail,
  inducedArcs,
  NodeNotFoundError,
  resolve,
  type SelectedNode,
} from "./resolve.ts";
import { indexVolume } from "./volume.ts";

const volume = indexVolume(toVolumeFile(validateVolume(fixture())));

describe("resolve, sous-arbre", () => {
  it("rend le nœud, ses descendants et les arcs entre eux, dans l'ordre de lecture", () => {
    expect(resolve(volume, { subtree: [T2] })).toEqual({
      nodes: [
        {
          id: T2,
          kind: "section",
          parentId: T1,
          documentReadingOrder: 2,
          text: "RUBRIQUE.",
          spans: [],
          anchors: [{ page: 1, x0: 100, y0: 40, x1: 600, y1: 60 }],
        },
        {
          id: E1,
          kind: "entry",
          parentId: T2,
          documentReadingOrder: 3,
          text: "Dupont, rue de la Paix, 12.",
          spans: [
            {
              label: "SUBJ",
              charStart: 0,
              charEnd: 6,
              normalized: "Dupont",
            },
            {
              label: "ADDR",
              charStart: 8,
              charEnd: 27,
              normalized: "rue de la Paix, 12.",
            },
          ],
          anchors: [{ page: 1, x0: 100, y0: 70, x1: 500, y1: 90 }],
        },
        {
          id: E2,
          kind: "entry",
          parentId: T2,
          documentReadingOrder: 4,
          text: "Martin, rue Longue, 3.",
          spans: [],
          anchors: [
            { page: 1, x0: 120, y0: 950, x1: 480, y1: 970 },
            { page: 2, x0: 100, y0: 10, x1: 300, y1: 30 },
          ],
        },
        {
          id: O1,
          kind: "out_of_scope",
          parentId: T2,
          documentReadingOrder: 5,
          text: "ALMANACH",
          spans: [],
          anchors: [{ page: 2, x0: 400, y0: 0, x1: 600, y1: 8 }],
        },
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

  it("descend récursivement dans les sous-rubriques", () => {
    const { nodes, arcs } = resolve(volume, { subtree: [T1] });
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

  it("réduit le sous-arbre d'une entrée à l'entrée seule", () => {
    const { nodes, arcs } = resolve(volume, { subtree: [E1] });
    expect(nodes.map((n) => n.id)).toEqual([E1]);
    expect(arcs).toEqual([]);
  });

  it("rend un nœud sans ligne boîtée avec des ancres vides", () => {
    const { nodes } = resolve(volume, { subtree: [E3] });
    expect(nodes).toMatchObject([{ id: E3, spans: [], anchors: [] }]);
  });
});

describe("resolve, plusieurs sous-arbres", () => {
  it("rend leur union, dans l'ordre de lecture, avec les arcs entre eux", () => {
    const { nodes, arcs } = resolve(volume, { subtree: [T2, E3] });
    expect(nodes.map((n) => n.id)).toEqual([E3, T2, E1, E2, O1]);
    // E3 → E1 : les deux sont sélectionnés ; ni E3 → T1 ni T2 → T1 : T1 ne l'est pas
    expect(arcs).toContainEqual({ source: E3, target: E1, kind: "follows" });
    expect(arcs.some((a) => a.target === T1)).toBe(false);
  });

  it("ne rend qu'une fois les nœuds de deux sous-arbres emboîtés", () => {
    const { nodes } = resolve(volume, { subtree: [T2, T1, E1] });
    expect(nodes.map((n) => n.id)).toEqual([T1, E3, T2, E1, E2, O1]);
  });

  it("se combine avec le texte", () => {
    const { nodes } = resolve(volume, { subtree: [T2, E3], text: "u" });
    expect(nodes.map((n) => n.id)).toEqual([E3, T2, E1, E2]); // Durand, RUBRIQUE., Dupont, Martin
  });
});

describe("resolve, texte", () => {
  const ids = (query: Query) => resolve(volume, query).nodes.map((n) => n.id);

  it("rend les nœuds de tout type qui contiennent le texte, et les arcs entre eux", () => {
    const { nodes, arcs } = resolve(volume, { text: "rue" });
    expect(nodes.map((n) => n.id)).toEqual([E1, E2]);
    expect(nodes[0]?.spans).toHaveLength(2);
    expect(arcs).toEqual([{ source: E1, target: E2, kind: "follows" }]);
    expect(ids({ text: "rubrique" })).toEqual([T2]);
    expect(ids({ text: "almanach" })).toEqual([O1]);
  });

  it("cherche la phrase entière, sans tenir compte des accents ni de la casse", () => {
    expect(ids({ text: "RUE DE LA PÂIX" })).toEqual([E1]);
    expect(ids({ text: "Paix rue" })).toEqual([]);
  });

  it("ne tolère pas les fautes", () => {
    expect(ids({ text: "Dupond" })).toEqual([]);
  });

  it("prend « % », « _ » et « \\ » à la lettre", () => {
    expect(ids({ text: "%" })).toEqual([]);
    expect(ids({ text: "D_pont" })).toEqual([]);
    expect(ids({ text: "\\" })).toEqual([]);
  });

  it("se combine avec le sous-arbre", () => {
    expect(ids({ subtree: [T1], text: "Durand" })).toEqual([E3]);
    expect(ids({ subtree: [T2], text: "Durand" })).toEqual([]);
  });
});

describe("resolve, sans critère", () => {
  it("ne rend rien", () => {
    expect(resolve(volume, {})).toEqual({ nodes: [], arcs: [] });
    expect(context(volume, {})).toEqual([]);
  });
});

describe("detail", () => {
  it("rend le nœud seul, avec ses empans, et le texte de ses rubriques de la racine au parent", () => {
    const { node, path } = detail(volume, E1);
    expect(node.id).toBe(E1);
    expect(node.spans).toHaveLength(2);
    expect(path).toEqual([
      { id: T1, text: "PARTIE." },
      { id: T2, text: "RUBRIQUE." },
    ]);
  });

  it("rend une rubrique sans son sous-arbre", () => {
    const { node, path } = detail(volume, T2);
    expect(node.id).toBe(T2);
    expect(path.map((s) => s.id)).toEqual([T1]);
  });

  it("refuse un nœud inconnu", () => {
    expect(() => detail(volume, "99999999-0000-0000-0000-000000000000")).toThrow(NodeNotFoundError);
  });
});

describe("context", () => {
  const t1 = {
    id: T1,
    kind: "section",
    parentId: null,
    documentReadingOrder: 0,
    text: "PARTIE.",
    spans: [],
    anchors: [{ page: 1, x0: 100, y0: 10, x1: 900, y1: 30 }],
  };
  const t2 = {
    id: T2,
    kind: "section",
    parentId: T1,
    documentReadingOrder: 2,
    text: "RUBRIQUE.",
    spans: [],
    anchors: [{ page: 1, x0: 100, y0: 40, x1: 600, y1: 60 }],
  };

  it("rend les rubriques ancêtres, nœuds complets, de la racine au parent", () => {
    expect(context(volume, { subtree: [E1] })).toEqual([t1, t2]);
  });

  it("ne compte pas le nœud lui-même, même s'il a des enfants", () => {
    expect(context(volume, { subtree: [T2] })).toEqual([t1]);
  });

  it("est vide pour un nœud racine", () => {
    expect(context(volume, { subtree: [T1] })).toEqual([]);
  });

  it("rend une fois les rubriques au-dessus de plusieurs sous-arbres", () => {
    expect(context(volume, { subtree: [T2, E3] })).toEqual([t1]);
    expect(context(volume, { subtree: [E1, E2] })).toEqual([t1, t2]);
  });

  describe("avec un texte", () => {
    const ids = (query: Query) => context(volume, query).map((n) => n.id);

    it("rend les rubriques au-dessus des résultats, chacune une fois", () => {
      expect(context(volume, { text: "Dupont" })).toEqual([t1, t2]);
      expect(ids({ text: "rue" })).toEqual([T1, T2]);
      expect(ids({ text: "u" })).toEqual([T1]); // Durand, Dupont, Martin, RUBRIQUE.
    });

    it("ne compte pas les rubriques qui contiennent le texte : elles sont sélectionnées", () => {
      expect(ids({ text: "rubrique" })).toEqual([T1]);
    });

    it("est le même avec un sous-arbre qui contient les résultats", () => {
      expect(ids({ subtree: [T2], text: "Dupont" })).toEqual([T1, T2]);
      expect(ids({ subtree: [E1], text: "Dupont" })).toEqual([T1, T2]);
    });

    it("est vide sans résultat", () => {
      expect(ids({ text: "introuvable" })).toEqual([]);
    });
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
