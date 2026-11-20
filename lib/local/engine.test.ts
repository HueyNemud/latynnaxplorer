// Le moteur local doit rendre exactement ce que rend la version SQL, qui fait foi : mêmes
// requêtes, sur la fixture, comparées à la base de test. Sur un vrai volume :
// scripts/compare-local.ts.

import { afterAll, describe, expect, inject, it } from "vitest";
import { E1, E2, E3, fixture, O1, T1, T2 } from "../../scripts/fixture.ts";
import { toRows } from "../../scripts/rows.ts";
import { validateVolume } from "../../scripts/validate.ts";
import { toVolumeFile } from "../../scripts/volume-file.ts";
import { connect } from "../db/client.ts";
import { facets } from "../query/facets.ts";
import type { Query } from "../query/query.ts";
import { context, detail, NodeNotFoundError, resolve } from "../query/resolve.ts";
import {
  contextLocal,
  detailLocal,
  facetsLocal,
  fold,
  indexVolume,
  resolveLocal,
} from "./engine.ts";

const sql = connect(inject("databaseUrl"));
afterAll(() => sql.end());

const volume = indexVolume(toVolumeFile(toRows(validateVolume(fixture()))));

const queries: Query[] = [
  {},
  { subtree: [T2] },
  { subtree: [T1] },
  { subtree: [T1, T2] },
  { subtree: [E1] },
  { text: "paix" },
  { text: "PAÎX" },
  { text: "rubrique" },
  { text: "introuvable" },
  { text: "paix", subtree: [T2] },
  { text: "paix", subtree: [T1] },
];

describe("moteur local, comparé à SQL sur la fixture", () => {
  it.each(queries)("resolve et context : %o", async (query) => {
    expect(resolveLocal(volume, query)).toEqual(await resolve(sql, query));
    expect(contextLocal(volume, query)).toEqual(await context(sql, query));
  });

  it.each([{}, { text: "paix" }, { text: "introuvable" }])("facets : %o", async (query) => {
    expect(facetsLocal(volume, query)).toEqual(await facets(sql, query));
  });

  it.each([T1, T2, E1, E2, E3, O1])("detail : %s", async (id) => {
    expect(detailLocal(volume, id)).toEqual(await detail(sql, id));
  });

  it("refuse un sous-arbre inconnu, comme SQL", () => {
    const unknown = "99999999-0000-0000-0000-000000000000";
    expect(() => resolveLocal(volume, { subtree: [T2, unknown] })).toThrow(NodeNotFoundError);
  });
});

describe("fold", () => {
  it("retire accents et casse, et réduit ligatures et tirets comme unaccent", () => {
    expect(fold("Œuvres — ÆGIDIUS, Bœuf, Élève")).toBe("oeuvres - aegidius, boeuf, eleve");
  });
});
