// Facettes de structure sur la fixture : T1 ⊃ { E3, T2 ⊃ { E1, E2, O1 } } (scripts/fixture.ts).
// E1 « Dupont, rue de la Paix, 12. », E2 « Martin, rue Longue, 3. », E3 « Durand… ».

import { afterAll, describe, expect, inject, it } from "vitest";
import { T1, T2 } from "../../scripts/fixture.ts";
import { connect } from "../db/client.ts";
import { facets } from "./facets.ts";

const sql = connect(inject("databaseUrl"));
afterAll(() => sql.end());

const entries = async (text?: string) =>
  (await facets(sql, text === undefined ? {} : { text })).sections.map((s) => [s.id, s.entries]);

describe("facets", () => {
  it("rend les volumes", async () => {
    expect((await facets(sql, {})).volumes).toEqual([
      { id: "TEST", title: "Annuaire de test", temporalStart: "1807-01-01" },
    ]);
  });

  it("rend les rubriques par ordre de lecture, un parent avant ses enfants", async () => {
    expect((await facets(sql, {})).sections).toEqual([
      { id: T1, parentId: null, volumeId: "TEST", text: "PARTIE.", entries: 3 },
      { id: T2, parentId: T1, volumeId: "TEST", text: "RUBRIQUE.", entries: 2 },
    ]);
  });

  it("compte les entrées de tout le sous-arbre, pas les titres ni les hors champ", async () => {
    expect(await entries()).toEqual([
      [T1, 3],
      [T2, 2],
    ]);
  });

  it("compte seulement les entrées qui contiennent le texte cherché", async () => {
    expect(await entries("rue")).toEqual([
      [T1, 2],
      [T2, 2],
    ]);
    expect(await entries("Durand")).toEqual([
      [T1, 1],
      [T2, 0],
    ]);
  });

  it("garde les rubriques sans résultat, à 0", async () => {
    expect(await entries("introuvable")).toEqual([
      [T1, 0],
      [T2, 0],
    ]);
  });
});
