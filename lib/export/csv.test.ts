import { describe, expect, it } from "vitest";
import { E1, E2, E3, fixtureFile, O1, T1, T2 } from "../../scripts/fixture.ts";
import { explore } from "../query/explore.ts";
import type { Query } from "../query/query.ts";
import { indexVolume } from "../query/volume.ts";
import { selectionCsv } from "./csv.ts";

const volume = indexVolume(fixtureFile());
const csv = (query: Query) => selectionCsv(volume, explore(volume, query).selection);
const lines = (text: string) => text.split("\r\n");

describe("selectionCsv", () => {
  it("une ligne par nœud, dans l'ordre de lecture, une colonne par niveau de rubrique", () => {
    expect(lines(csv({ subtree: [T1] }))).toEqual([
      "﻿volume,id,kind,parent_id,reading_order,section_1,section_2,text,subject,description,address,pages",
      `TEST,${T1},section,,0,,,PARTIE.,,,,1`,
      `TEST,${E3},entry,${T1},1,PARTIE.,,Durand.,,,,`,
      `TEST,${T2},section,${T1},2,PARTIE.,,RUBRIQUE.,,,,1`,
      `TEST,${E1},entry,${T2},3,PARTIE.,RUBRIQUE.,"Dupont, rue de la Paix, 12.",Dupont,,"rue de la Paix, 12.",1`,
      `TEST,${E2},entry,${T2},4,PARTIE.,RUBRIQUE.,"Martin, rue Longue, 3.",,,,1 | 2`,
      `TEST,${O1},out_of_scope,${T2},5,PARTIE.,RUBRIQUE.,ALMANACH,,,,2`,
      "",
    ]);
  });

  it("autant de colonnes de rubrique que le chemin le plus long de la sélection", () => {
    expect(lines(csv({ subtree: [E3] }))[0]).toContain("reading_order,section_1,text");
  });

  it("sélection vide : l'en-tête seul", () => {
    expect(csv({ text: "introuvable" })).toBe(
      "﻿volume,id,kind,parent_id,reading_order,text,subject,description,address,pages\r\n",
    );
  });

  it("double les guillemets d'une case et la met entre guillemets", () => {
    const quoted = indexVolume({
      volume: volume.meta,
      nodes: [{ id: E3, kind: "entry", parentId: null, text: 'Durand, dit "le jeune".' }],
    });
    expect(lines(selectionCsv(quoted, quoted.nodes))[1]).toBe(
      `TEST,${E3},entry,,0,"Durand, dit ""le jeune"".",,,,`,
    );
  });
});
