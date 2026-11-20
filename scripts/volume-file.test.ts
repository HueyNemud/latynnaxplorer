// Fixture : T1 ⊃ { E3, T2 ⊃ { E1, E2, O1 } } (scripts/fixture.ts).

import { describe, expect, it } from "vitest";
import { indexVolume } from "../lib/query/volume.ts";
import { E1, E2, E3, fixture, O1, T1, T2 } from "./fixture.ts";
import { validateVolume } from "./validate.ts";
import { anchorsOf, refuseLoops, toVolumeFile, withVolume } from "./volume-file.ts";

const file = toVolumeFile(validateVolume(fixture()));
const node = (id: string) => file.nodes.find((n) => n.id === id);

describe("toVolumeFile", () => {
  it("reprend le volume tel que l'index et les facettes le lisent", () => {
    expect(file.volume).toEqual({
      id: "TEST",
      title: "Annuaire de test",
      temporalStart: "1807-01-01",
    });
  });

  it("range tous les nœuds ensemble, dans l'ordre de lecture de leur première ligne", () => {
    expect(file.nodes.map((n) => [n.kind, n.id])).toEqual([
      ["section", T1],
      ["entry", E3],
      ["section", T2],
      ["entry", E1],
      ["entry", E2],
      ["out_of_scope", O1],
    ]);
  });

  it("refuse un nœud dont la première ligne est absente de document.json", () => {
    const files = validateVolume(fixture());
    files.structure.titles[0]?.lines.splice(0, 1, { line: "1-2:inconnue" });
    expect(() => toVolumeFile(files)).toThrow(
      `nœud ${T1} : première ligne absente de document.json`,
    );
  });

  it("rattache à la racine (null) les nœuds dont le parent est la racine numrev", () => {
    const parents = Object.fromEntries(file.nodes.map((n) => [n.id, n.parentId]));
    expect(parents).toEqual({ [T1]: null, [T2]: T1, [E1]: T2, [E2]: T2, [E3]: T1, [O1]: T2 });
  });

  it("prend le titre lisible d'une section et le texte des autres nœuds", () => {
    expect(node(T2)?.text).toBe("RUBRIQUE.");
    expect(node(E1)?.text).toBe("Dupont, rue de la Paix, 12.");
    expect(node(O1)?.text).toBe("ALMANACH");
  });

  it("reprend les empans des entrées, sans le texte normalisé égal à celui de l'empan", () => {
    expect(node(E1)?.spans).toEqual([
      { label: "SUBJ", charStart: 0, charEnd: 6 },
      { label: "ADDR", charStart: 8, charEnd: 27 },
    ]);
  });

  it("garde le texte normalisé quand il diffère de celui de l'empan", () => {
    const files = validateVolume(fixture());
    const span = files.structure.entries.find((e) => e.id === E1)?.spans[0];
    if (span) span.normalized = "DUPONT";
    const spans = toVolumeFile(files).nodes.find((n) => n.id === E1)?.spans;
    expect(spans?.[0]).toEqual({ label: "SUBJ", charStart: 0, charEnd: 6, normalized: "DUPONT" });
  });

  it("ancre chaque nœud sur chaque page touchée, sauf sans ligne boîtée", () => {
    expect(file.nodes.map((n) => [n.id, n.anchors?.map((a) => Object.values(a))])).toEqual([
      [T1, [[1, 100, 10, 900, 30]]],
      [E3, undefined],
      [T2, [[1, 100, 40, 600, 60]]],
      [E1, [[1, 100, 70, 500, 90]]],
      [
        E2,
        [
          [1, 120, 950, 480, 970],
          [2, 100, 10, 300, 30],
        ],
      ],
      [O1, [[2, 400, 0, 600, 8]]],
    ]);
  });

  it("omet empans et ancres absents", () => {
    expect(node(T1)).not.toHaveProperty("spans");
    expect(node(E3)).not.toHaveProperty("anchors");
  });
});

describe("indexVolume", () => {
  it("rétablit ordre de lecture, empans et ancres vides, et texte normalisé omis", () => {
    const volume = indexVolume(file);
    expect(volume.nodes.map((n) => n.documentReadingOrder)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(volume.byId.get(T1)?.spans).toEqual([]);
    expect(volume.byId.get(E3)?.anchors).toEqual([]);
    expect(volume.byId.get(E1)?.spans.map((s) => s.normalized)).toEqual([
      "Dupont",
      "rue de la Paix, 12.",
    ]);
  });

  it("relie chaque entrée à l'entrée suivante dans l'ordre de lecture, à travers les sections", () => {
    // T2 s'intercale entre E3 et E1 ; E2 est la dernière entrée du volume
    expect(Object.fromEntries(indexVolume(file).nextEntry)).toEqual({ [E3]: E1, [E1]: E2 });
  });
});

describe("anchorsOf", () => {
  const lines = new Map([
    ["a", { page: 3, bbox: [100, 10, 500, 30] as [number, number, number, number] }],
    ["b", { page: 3, bbox: [80, 35, 400, 55] as [number, number, number, number] }],
    ["c", { page: 3, bbox: null }],
  ]);

  it("fait l'union des boîtes des lignes d'une même page et ignore les lignes sans boîte", () => {
    expect(anchorsOf("n", ["a", "b", "c"], lines)).toEqual([
      { page: 3, x0: 80, y0: 10, x1: 500, y1: 55 },
    ]);
  });

  it("refuse une ligne absente de document.json", () => {
    expect(() => anchorsOf("n", ["x"], lines)).toThrow("nœud n : ligne x absente de document.json");
  });
});

describe("refuseLoops", () => {
  it("accepte une forêt", () => {
    expect(() =>
      refuseLoops([
        { id: "a", parentId: null },
        { id: "b", parentId: "a" },
        { id: "c", parentId: "b" },
      ]),
    ).not.toThrow();
  });

  it("refuse une boucle dans les parents", () => {
    const nodes = [
      { id: "a", parentId: "b" },
      { id: "b", parentId: "a" },
    ];
    expect(() => refuseLoops(nodes)).toThrow("boucle dans ses parents");
  });
});

describe("withVolume", () => {
  const v = (id: string, temporalStart: string) => ({
    id,
    title: null,
    temporalStart,
    url: `${id}.json`,
  });

  it("ajoute un volume, ou le remplace, dans l'ordre des dates", () => {
    const index = withVolume(
      withVolume({ volumes: [] }, v("B", "1820-01-01")),
      v("A", "1807-01-01"),
    );
    expect(index.volumes.map((x) => x.id)).toEqual(["A", "B"]);
    const replaced = withVolume(index, { ...v("B", "1820-01-01"), title: "Bottin" });
    expect(replaced.volumes.map((x) => [x.id, x.title])).toEqual([
      ["A", null],
      ["B", "Bottin"],
    ]);
  });
});
