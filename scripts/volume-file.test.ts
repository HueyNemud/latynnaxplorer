import { describe, expect, it } from "vitest";
import { indexVolume } from "../lib/local/engine.ts";
import { E1, E2, E3, fixture, O1, T1, T2 } from "./fixture.ts";
import { toRows } from "./rows.ts";
import { validateVolume } from "./validate.ts";
import { toVolumeFile, withVolume } from "./volume-file.ts";

const rows = toRows(validateVolume(fixture()));
const file = toVolumeFile(rows);
const node = (id: string) => file.nodes.find((n) => n.id === id);

describe("toVolumeFile", () => {
  it("reprend le volume tel que les facettes le lisent", () => {
    expect(file.volume).toEqual({
      id: "TEST",
      title: "Annuaire de test",
      temporalStart: "1807-01-01",
    });
  });

  it("donne tous les nœuds dans l'ordre de lecture, avec leur parent", () => {
    expect(file.nodes.map((n) => [n.kind, n.id, n.parentId])).toEqual([
      ["section", T1, null],
      ["entry", E3, T1],
      ["section", T2, T1],
      ["entry", E1, T2],
      ["entry", E2, T2],
      ["out_of_scope", O1, T2],
    ]);
  });

  it("omet empans et ancres absents, et le texte normalisé égal à celui de l'empan", () => {
    expect(node(T1)).not.toHaveProperty("spans");
    expect(node(E3)).not.toHaveProperty("anchors");
    expect(node(E1)?.spans).toEqual([
      { label: "SUBJ", charStart: 0, charEnd: 6 },
      { label: "ADDR", charStart: 8, charEnd: 27 },
    ]);
    expect(node(E2)?.anchors?.map((a) => a.page)).toEqual([1, 2]);
  });

  it("garde le texte normalisé quand il diffère, et indexVolume rétablit les autres", () => {
    const edited = {
      ...rows,
      spans: rows.spans.map((s, i) => (i === 0 ? { ...s, normalized: "DUPONT" } : s)),
    };
    const spans = toVolumeFile(edited).nodes.find((n) => n.id === E1)?.spans;
    expect(spans?.[0]).toHaveProperty("normalized", "DUPONT");
    const restored = indexVolume(toVolumeFile(edited)).byId.get(E1)?.spans;
    expect(restored?.map((s) => s.normalized)).toEqual(["DUPONT", "rue de la Paix, 12."]);
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
