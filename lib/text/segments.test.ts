import { describe, expect, it } from "vitest";
import { plainText, segments } from "./segments.ts";

const span = (id: string, label: "SUBJ" | "DESC" | "ADDR", charStart: number, charEnd: number) => ({
  id,
  label,
  charStart,
  charEnd,
});

describe("segments", () => {
  it("rend le texte d'un seul tenant sans emphase ni empan", () => {
    expect(segments("ALMANACH", [])).toEqual([{ text: "ALMANACH", emphasis: false, span: null }]);
  });

  it("retire les marques d'emphase et découpe aux bornes des empans", () => {
    // empans de numrev : DESC couvre « *en gros* », astérisques compris
    const text = "Gabillot aîné, *en gros*, rue du Faubourg-Saint-Honoré, 3.";
    expect(
      segments(text, [
        span("s", "SUBJ", 0, 13),
        span("d", "DESC", 15, 24),
        span("a", "ADDR", 26, 58),
      ]),
    ).toEqual([
      { text: "Gabillot aîné", emphasis: false, span: { id: "s", label: "SUBJ" } },
      { text: ", ", emphasis: false, span: null },
      { text: "en gros", emphasis: true, span: { id: "d", label: "DESC" } },
      { text: ", ", emphasis: false, span: null },
      {
        text: "rue du Faubourg-Saint-Honoré, 3.",
        emphasis: false,
        span: { id: "a", label: "ADDR" },
      },
    ]);
  });

  it("découpe un empan qui commence au milieu d'une emphase", () => {
    // « *ancien distillateur d'eau* de Cologne » : l'empan finit après l'emphase
    expect(segments("A, *b c* d.", [span("d", "DESC", 6, 10)])).toEqual([
      { text: "A, ", emphasis: false, span: null },
      { text: "b ", emphasis: true, span: null },
      { text: "c", emphasis: true, span: { id: "d", label: "DESC" } },
      { text: " d", emphasis: false, span: { id: "d", label: "DESC" } },
      { text: ".", emphasis: false, span: null },
    ]);
  });

  it("garde deux empans voisins séparés", () => {
    expect(segments("ab", [span("1", "SUBJ", 0, 1), span("2", "SUBJ", 1, 2)])).toEqual([
      { text: "a", emphasis: false, span: { id: "1", label: "SUBJ" } },
      { text: "b", emphasis: false, span: { id: "2", label: "SUBJ" } },
    ]);
  });

  it("affiche un astérisque échappé sans changer l'emphase", () => {
    expect(segments("8 \\*", [])).toEqual([{ text: "8 *", emphasis: false, span: null }]);
  });

  it("compte les positions en points de code", () => {
    // « 𝔄 » tient deux unités UTF-16 mais un seul point de code
    expect(segments("𝔄 b", [span("s", "SUBJ", 2, 3)])).toEqual([
      { text: "𝔄 ", emphasis: false, span: null },
      { text: "b", emphasis: false, span: { id: "s", label: "SUBJ" } },
    ]);
  });

  it("garde les retours à la ligne", () => {
    expect(segments("a.\nb.", [])).toEqual([{ text: "a.\nb.", emphasis: false, span: null }]);
  });
});

describe("plainText", () => {
  it("retire les marques d'emphase et garde les astérisques échappés", () => {
    expect(plainText("Gabillot aîné, *en gros*, 3 \\* 4.")).toBe("Gabillot aîné, en gros, 3 * 4.");
  });

  it("met le texte sur une ligne", () => {
    expect(plainText("Dupont,\n  rue de la Paix.")).toBe("Dupont, rue de la Paix.");
  });
});
