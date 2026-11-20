import { describe, expect, it } from "vitest";
import { fold } from "./fold.ts";

describe("fold", () => {
  it("retire accents et casse", () => {
    expect(fold("Élève À PÂQUES, rue Saint-Honoré")).toBe("eleve a paques, rue saint-honore");
  });

  it("ramène ligatures, tirets et apostrophes typographiques à leur forme simple", () => {
    expect(fold("Œuvres — ÆGIDIUS, Bœuf, l’Hôtel")).toBe("oeuvres - aegidius, boeuf, l'hotel");
  });
});
