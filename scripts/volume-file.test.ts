import { describe, expect, it } from "vitest";
import { E1, E2, E3, fixture, O1, T1, T2 } from "./fixture.ts";
import { toRows } from "./rows.ts";
import { validateVolume } from "./validate.ts";
import { toVolumeFile } from "./volume-file.ts";

const rows = toRows(validateVolume(fixture()));
const file = toVolumeFile(rows);

describe("toVolumeFile", () => {
  it("reprend le volume tel que les facettes le lisent", () => {
    expect(file.volume).toEqual({
      id: "TEST",
      title: "Annuaire de test",
      temporalStart: "1807-01-01",
    });
  });

  it("donne tous les nœuds dans l'ordre de lecture, avec leur parent", () => {
    expect(file.nodes.map((n) => [n.documentReadingOrder, n.kind, n.id, n.parentId])).toEqual([
      [0, "section", T1, null],
      [1, "entry", E3, T1],
      [2, "section", T2, T1],
      [3, "entry", E1, T2],
      [4, "entry", E2, T2],
      [5, "out_of_scope", O1, T2],
    ]);
  });

  it("rattache à chaque nœud ses empans et ses ancres, sans leur nodeId", () => {
    const spans = rows.spans.filter((s) => s.nodeId === E1);
    const node = file.nodes.find((n) => n.id === E1);
    expect(node?.spans.map((s) => s.id)).toEqual(spans.map((s) => s.id));
    expect(node?.spans[0]).not.toHaveProperty("nodeId");
    expect(file.nodes.find((n) => n.id === E2)?.anchors.map((a) => a.page)).toEqual([1, 2]);
    expect(file.nodes.find((n) => n.id === E3)?.anchors).toEqual([]);
  });
});
