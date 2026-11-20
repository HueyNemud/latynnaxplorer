// Coches des facettes sur un petit arbre : volume V, A ⊃ { A1, A2 ⊃ { A2a } } et B ;
// volume W, C.

import { describe, expect, it } from "vitest";
import type { FacetSection } from "../query/types.ts";
import {
  checkedOf,
  isCovered,
  isVolumeSelected,
  pathTo,
  sameChecks,
  sectionTree,
  toggleSection,
  toggleVolume,
} from "./selection.ts";

const section = (id: string, parentId: string | null, volumeId = "V"): FacetSection => ({
  id,
  parentId,
  volumeId,
  text: id,
  entries: 0,
});

const tree = sectionTree([
  section("A", null),
  section("A1", "A"),
  section("A2", "A"),
  section("A2a", "A2"),
  section("B", null),
  section("C", null, "W"),
]);

const set = (...ids: string[]) => new Set(ids);

describe("sectionTree", () => {
  it("range les rubriques de premier niveau sous leur volume, les autres sous leur parent", () => {
    const ids = (key: string) => tree.children.get(key)?.map((s) => s.id);
    expect(ids("V")).toEqual(["A", "B"]);
    expect(ids("W")).toEqual(["C"]);
    expect(ids("A")).toEqual(["A1", "A2"]);
    expect(ids("A2a")).toBeUndefined();
  });
});

describe("checkedOf", () => {
  it("ne garde que les rubriques", () => {
    expect(checkedOf(tree, ["A2", "une-entrée"])).toEqual(set("A2"));
  });
});

describe("isCovered", () => {
  it("couvre tout le sous-arbre d'une rubrique cochée, pas la rubrique elle-même", () => {
    const checked = set("A");
    expect(["A", "A1", "A2", "A2a", "B"].map((id) => isCovered(tree, checked, id))).toEqual([
      false,
      true,
      true,
      true,
      false,
    ]);
  });
});

describe("toggleSection", () => {
  it("coche une rubrique et ne garde pas ses descendants cochés", () => {
    expect(toggleSection(tree, set("A1", "A2a", "B"), "A")).toEqual(set("A", "B"));
  });

  it("décoche une rubrique : ses descendants redeviennent libres, décochés", () => {
    const checked = toggleSection(tree, set("A", "B"), "A");
    expect(checked).toEqual(set("B"));
    expect(isCovered(tree, checked, "A1")).toBe(false);
  });

  it("ne modifie pas les coches reçues", () => {
    const checked = set("B");
    toggleSection(tree, checked, "A");
    expect(checked).toEqual(set("B"));
  });
});

describe("volumes", () => {
  it("un volume est sélectionné si une de ses rubriques l'est", () => {
    expect(isVolumeSelected(tree, set("A2a"), "V")).toBe(true);
    expect(isVolumeSelected(tree, set("A2a"), "W")).toBe(false);
  });

  it("cocher un volume coche ses rubriques de premier niveau, sans toucher aux autres volumes", () => {
    expect(toggleVolume(tree, set("C"), "V")).toEqual(set("C", "A", "B"));
  });

  it("décocher un volume retire toutes ses coches", () => {
    expect(toggleVolume(tree, set("A2a", "C"), "V")).toEqual(set("C"));
  });
});

describe("sameChecks", () => {
  it("compare les coches sans tenir compte de l'ordre", () => {
    expect(sameChecks(set("A", "B"), set("B", "A"))).toBe(true);
    expect(sameChecks(set("A"), set("A", "B"))).toBe(false);
    expect(sameChecks(set("A", "C"), set("A", "B"))).toBe(false);
  });
});

describe("pathTo", () => {
  it("déplie les rubriques au-dessus de chaque coche", () => {
    expect(pathTo(tree, set("A2a", "B"))).toEqual(set("A2", "A"));
  });
});
