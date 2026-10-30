import { describe, expect, it } from "vitest";
import { E1, E2, E3, fixture, T1, T2 } from "./fixture.ts";
import { anchorsOf, toRows } from "./rows.ts";
import { validateVolume } from "./validate.ts";

const rows = toRows(validateVolume(fixture()));

describe("toRows", () => {
  it("reprend le volume et son intervalle temporel", () => {
    expect(rows.volume).toEqual({
      id: "TEST",
      title: "Annuaire de test",
      temporalStart: "1807-01-01",
      temporalEnd: "1807-12-31",
    });
  });

  it("range sections et entrées ensemble, dans l'ordre de lecture de leur première ligne", () => {
    expect(rows.nodes.map((n) => [n.documentReadingOrder, n.kind, n.id])).toEqual([
      [0, "section", T1],
      [1, "entry", E3],
      [2, "section", T2],
      [3, "entry", E1],
      [4, "entry", E2],
    ]);
  });

  it("refuse un nœud dont la première ligne est absente de document.json", () => {
    const files = validateVolume(fixture());
    files.structure.titles[0]?.lines.splice(0, 1, { line: "1-2:inconnue" });
    expect(() => toRows(files)).toThrow(`nœud ${T1} : première ligne absente de document.json`);
  });

  it("rattache à la racine (null) les nœuds dont le parent est la racine numrev", () => {
    const parents = Object.fromEntries(rows.nodes.map((n) => [n.id, n.parentId]));
    expect(parents).toEqual({ [T1]: null, [T2]: T1, [E1]: T2, [E2]: T2, [E3]: T1 });
  });

  it("prend le titre lisible d'une section et le texte d'une entrée", () => {
    expect(rows.nodes.find((n) => n.id === T2)?.text).toBe("RUBRIQUE.");
    expect(rows.nodes.find((n) => n.id === E1)?.text).toBe("Dupont, rue de la Paix, 12.");
  });

  it("reprend les empans des entrées avec leur position", () => {
    expect(
      rows.spans.map((s) => [s.nodeId, s.label, s.charStart, s.charEnd, s.normalized]),
    ).toEqual([
      [E1, "SUBJ", 0, 6, "Dupont"],
      [E1, "ADDR", 8, 27, "rue de la Paix, 12."],
    ]);
  });

  it("ancre chaque nœud sur chaque page touchée, sauf sans ligne boîtée", () => {
    expect(rows.anchors.map((a) => [a.nodeId, a.page, a.x0, a.y0, a.x1, a.y1])).toEqual([
      [T1, 1, 100, 10, 900, 30],
      [T2, 1, 100, 40, 600, 60],
      [E1, 1, 100, 70, 500, 90],
      [E2, 1, 120, 950, 480, 970],
      [E2, 2, 100, 10, 300, 30],
    ]);
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
      { nodeId: "n", page: 3, x0: 80, y0: 10, x1: 500, y1: 55 },
    ]);
  });

  it("refuse une ligne absente de document.json", () => {
    expect(() => anchorsOf("n", ["x"], lines)).toThrow("nœud n : ligne x absente de document.json");
  });
});
