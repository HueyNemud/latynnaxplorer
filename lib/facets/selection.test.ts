// Cases des facettes sur un petit arbre : A ⊃ { A1, A2 ⊃ { A2a } } et B.

import { describe, expect, it } from "vitest";
import type { FacetSection } from "../query/types.ts";
import {
  checkedOf,
  coveredBy,
  keepOnly,
  pathTo,
  sectionTree,
  toggleSection,
  toggleVolume,
  volumeState,
} from "./selection.ts";

const section = (id: string, parentId: string | null): FacetSection => ({
  id,
  parentId,
  text: id,
  entries: 0,
});

const tree = sectionTree([
  section("A", null),
  section("A1", "A"),
  section("A2", "A"),
  section("A2a", "A2"),
  section("B", null),
]);

const set = (...ids: string[]) => new Set(ids);

describe("sectionTree", () => {
  it("range les rubriques de premier niveau sous null, les autres sous leur parent", () => {
    const ids = (key: string | null) => tree.children.get(key)?.map((s) => s.id);
    expect(ids(null)).toEqual(["A", "B"]);
    expect(ids("A")).toEqual(["A1", "A2"]);
    expect(ids("A2a")).toBeUndefined();
  });
});

describe("checkedOf", () => {
  it("ne garde que les rubriques", () => {
    expect(checkedOf(tree, ["A2", "une-entrée"])).toEqual(set("A2"));
  });
});

describe("coveredBy", () => {
  it("couvre tout le sous-arbre d'une rubrique cochée, pas la rubrique elle-même", () => {
    const checked = set("A");
    expect(["A", "A1", "A2", "A2a", "B"].map((id) => coveredBy(tree, checked, id)?.id)).toEqual([
      undefined,
      "A",
      "A",
      "A",
      undefined,
    ]);
  });
});

describe("keepOnly", () => {
  it("décoche la rubrique qui couvre et ne coche que celle-ci, même plus bas", () => {
    expect(keepOnly(tree, set("A", "B"), "A2")).toEqual(set("B", "A2"));
    expect(keepOnly(tree, set("A"), "A2a")).toEqual(set("A2a"));
  });
});

describe("toggleSection", () => {
  it("coche une rubrique et ne garde pas ses descendants cochés", () => {
    expect(toggleSection(tree, set("A1", "A2a", "B"), "A")).toEqual(set("A", "B"));
  });

  it("décoche une rubrique : ses descendants redeviennent libres, décochés", () => {
    const checked = toggleSection(tree, set("A", "B"), "A");
    expect(checked).toEqual(set("B"));
    expect(coveredBy(tree, checked, "A1")).toBeUndefined();
  });

  it("ne modifie pas l'ensemble reçu", () => {
    const checked = set("B");
    toggleSection(tree, checked, "A");
    expect(checked).toEqual(set("B"));
  });
});

describe("case ronde", () => {
  it("coche les rubriques de premier niveau, que le volume soit en partie coché ou non", () => {
    expect(toggleVolume(tree, set())).toEqual(set("A", "B"));
    expect(toggleVolume(tree, set("A2a"))).toEqual(set("A", "B"));
  });

  it("décoche tout quand le volume est entier", () => {
    expect(toggleVolume(tree, set("A", "B"))).toEqual(set());
  });

  it("état : entier, en partie ou rien", () => {
    expect(volumeState(tree, set("A", "B"))).toBe(true);
    expect(volumeState(tree, set("A2a"))).toBe("indeterminate");
    expect(volumeState(tree, set())).toBe(false);
  });
});

describe("pathTo", () => {
  it("déplie les rubriques au-dessus de chaque rubrique cochée", () => {
    expect(pathTo(tree, set("A2a", "B"))).toEqual(set("A2", "A"));
  });
});
