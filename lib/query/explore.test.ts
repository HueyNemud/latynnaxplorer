// Deux volumes : la fixture (TEST, 1807) et sa copie (AUTRE, 1820), aux identifiants préfixés
// de « autre- ». Fixture : T1 ⊃ { E3, T2 ⊃ { E1, E2, O1 } } (scripts/fixture.ts).

import { describe, expect, it } from "vitest";
import { E1, E2, fixture, O1, T1, T2 } from "../../scripts/fixture.ts";
import { validateVolume } from "../../scripts/validate.ts";
import { toVolumeFile } from "../../scripts/volume-file.ts";
import { detail, neededVolumes, view, volumeOf } from "./explore.ts";
import { NodeNotFoundError } from "./resolve.ts";
import { indexVolume, type VolumeFile } from "./volume.ts";

const file = toVolumeFile(validateVolume(fixture()));
const other = (id: string) => `autre-${id}`;
const copy: VolumeFile = {
  volume: { id: "AUTRE", title: null, temporalStart: "1820-01-01" },
  nodes: file.nodes.map((n) => ({
    ...n,
    id: other(n.id),
    parentId: n.parentId === null ? null : other(n.parentId),
  })),
};
const first = indexVolume(file);
const second = indexVolume(copy);
const ALL = ["TEST", "AUTRE"];

describe("neededVolumes", () => {
  it("demande le volume regardé, rien d'autre sans texte ni sous-arbre inconnu", () => {
    expect(neededVolumes(ALL, [], {}, "AUTRE")).toEqual(["AUTRE"]);
    expect(neededVolumes(ALL, [first], { subtree: [T2] }, "TEST")).toEqual(["TEST"]);
    expect(neededVolumes(ALL, [first], { subtree: [T2], text: "paix" }, "TEST")).toEqual(["TEST"]);
  });

  it("demande tous les volumes pour un texte seul, ou un sous-arbre d'aucun volume chargé", () => {
    expect(neededVolumes(ALL, [first], { text: "paix" }, "TEST")).toEqual(ALL);
    expect(neededVolumes(ALL, [first], { subtree: [other(T2)] }, "TEST")).toEqual(ALL);
  });
});

describe("view", () => {
  it("met bout à bout les volumes, chacun dans l'ordre de lecture, contexte compris", () => {
    const { selection, shown } = view([first, second], { subtree: [T2, other(E1)] });
    expect(selection.map((n) => n.id)).toEqual([T2, E1, E2, O1, other(E1)]);
    // contexte : T1 au-dessus de T2 ; dans AUTRE, T1 et T2 au-dessus de E1
    expect(shown.map((n) => n.id)).toEqual([
      T1,
      ...selection.slice(0, 4).map((n) => n.id),
      other(T1),
      other(T2),
      other(E1),
    ]);
  });

  it("cherche le texte dans tous les volumes chargés, facettes comprises", () => {
    const { selection, sections } = view([first, second], { text: "paix" });
    expect(selection.map((n) => n.id)).toEqual([E1, other(E1)]);
    expect(sections.map((s) => [s.volumeId, s.id, s.entries])).toEqual([
      ["TEST", T1, 1],
      ["TEST", T2, 1],
      ["AUTRE", other(T1), 1],
      ["AUTRE", other(T2), 1],
    ]);
  });

  it("refuse un sous-arbre qui n'est dans aucun volume chargé, même avec un texte", () => {
    expect(() => view([first], { subtree: [T2, other(T2)] })).toThrow(NodeNotFoundError);
    expect(() => view([first, second], { subtree: ["inconnu"], text: "rue" })).toThrow(
      "nœud inconnu : inconnu",
    );
  });
});

describe("volumeOf", () => {
  it("trouve le volume d'un nœud parmi les volumes chargés", () => {
    expect(volumeOf([first, second], other(E1))?.meta.id).toBe("AUTRE");
    expect(volumeOf([first], other(E1))).toBeUndefined();
  });
});

describe("detail", () => {
  it("rend le nœud seul, avec ses empans, et ses rubriques de la racine au parent", () => {
    const { node, path } = detail([first, second], E1);
    expect(node.id).toBe(E1);
    expect(node.spans).toHaveLength(2);
    expect(path.map((s) => [s.id, s.text])).toEqual([
      [T1, "PARTIE."],
      [T2, "RUBRIQUE."],
    ]);
  });

  it("trouve le nœud dans son volume ; une rubrique, sans son sous-arbre", () => {
    const { node, path } = detail([first, second], other(T2));
    expect(node.id).toBe(other(T2));
    expect(path.map((s) => s.id)).toEqual([other(T1)]);
  });

  it("refuse un nœud d'aucun volume chargé", () => {
    expect(() => detail([first], other(E1))).toThrow(NodeNotFoundError);
  });
});
