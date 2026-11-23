import { describe, expect, it } from "vitest";
import { fixtureVolume, T1, T2 } from "../../scripts/fixture.ts";
import { sections } from "./facets.ts";

const volume = fixtureVolume();

const entries = (text?: string) =>
  sections(volume, text === undefined ? {} : { text }).map((s) => [s.id, s.entries]);

describe("sections", () => {
  it("rend les rubriques par ordre de lecture, un parent avant ses enfants", () => {
    expect(sections(volume, {})).toEqual([
      { id: T1, parentId: null, volumeId: "TEST", text: "PARTIE.", entries: 3 },
      { id: T2, parentId: T1, volumeId: "TEST", text: "RUBRIQUE.", entries: 2 },
    ]);
  });

  it("compte les entrées de tout le sous-arbre, pas les rubriques ni les hors champ", () => {
    expect(entries()).toEqual([
      [T1, 3],
      [T2, 2],
    ]);
  });

  it("compte seulement les entrées qui contiennent le texte cherché", () => {
    expect(entries("rue")).toEqual([
      [T1, 2],
      [T2, 2],
    ]);
    expect(entries("Durand")).toEqual([
      [T1, 1],
      [T2, 0],
    ]);
  });

  it("garde les rubriques sans résultat, à 0", () => {
    expect(entries("introuvable")).toEqual([
      [T1, 0],
      [T2, 0],
    ]);
  });
});
