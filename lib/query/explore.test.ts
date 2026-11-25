import { describe, expect, it } from "vitest";
import { E1, E2, fixtureVolume, O1, T1, T2 } from "../../scripts/fixture.ts";
import { explore, withContext } from "./explore.ts";
import { NodeNotFoundError } from "./resolve.ts";

const volume = fixtureVolume();

describe("explore", () => {
  it("sélectionne dans l'ordre de lecture et donne les rubriques avec leurs décomptes", () => {
    const { selection, sections } = explore(volume, { text: "paix" });
    expect(selection.map((n) => n.id)).toEqual([E1]);
    expect(sections.map((s) => [s.id, s.entries])).toEqual([
      [T1, 1],
      [T2, 1],
    ]);
  });

  it("refuse un sous-arbre qui n'est pas dans le volume, même avec un texte", () => {
    expect(() => explore(volume, { subtree: [T2, "ailleurs"] })).toThrow(NodeNotFoundError);
    expect(() => explore(volume, { subtree: ["inconnu"], text: "rue" })).toThrow(
      "nœud inconnu : inconnu",
    );
  });
});

describe("withContext", () => {
  const { selection } = explore(volume, { subtree: [T2] });

  it("ajoute le contexte des nœuds, dans l'ordre de lecture", () => {
    // T1 au-dessus de T2
    expect(withContext(volume, selection).map((n) => n.id)).toEqual([T1, T2, E1, E2, O1]);
  });

  it("ne donne le contexte que des nœuds montrés : une part de la sélection", () => {
    // E2 sans T2 : T2 n'est plus que du contexte, comme T1
    const part = selection.filter((n) => n.id === E2);
    expect(withContext(volume, part).map((n) => n.id)).toEqual([T1, T2, E2]);
  });
});
