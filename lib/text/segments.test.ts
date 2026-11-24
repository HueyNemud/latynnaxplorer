import { describe, expect, it } from "vitest";
import { plainText, segments } from "./segments.ts";

const span = (label: "SUBJ" | "DESC" | "ADDR", charStart: number, charEnd: number) => ({
  label,
  charStart,
  charEnd,
});

describe("segments", () => {
  it("rend le texte d'un seul tenant sans emphase ni empan", () => {
    expect(segments("ALMANACH", [])).toMatchObject([
      { text: "ALMANACH", emphasis: false, span: null, mark: false },
    ]);
  });

  it("retire les marques d'emphase et découpe aux bornes des empans", () => {
    // empans de numrev : DESC couvre « *en gros* », astérisques compris
    const text = "Gabillot aîné, *en gros*, rue du Faubourg-Saint-Honoré, 3.";
    expect(
      segments(text, [span("SUBJ", 0, 13), span("DESC", 15, 24), span("ADDR", 26, 58)]),
    ).toMatchObject([
      { text: "Gabillot aîné", emphasis: false, span: { label: "SUBJ" }, mark: false },
      { text: ", ", emphasis: false, span: null, mark: false },
      { text: "en gros", emphasis: true, span: { label: "DESC" }, mark: false },
      { text: ", ", emphasis: false, span: null, mark: false },
      {
        text: "rue du Faubourg-Saint-Honoré, 3.",
        emphasis: false,
        span: { label: "ADDR" },
        mark: false,
      },
    ]);
  });

  it("découpe un empan qui commence au milieu d'une emphase", () => {
    // « *ancien distillateur d'eau* de Cologne » : l'empan finit après l'emphase
    expect(segments("A, *b c* d.", [span("DESC", 6, 10)])).toMatchObject([
      { text: "A, ", emphasis: false, span: null, mark: false },
      { text: "b ", emphasis: true, span: null, mark: false },
      { text: "c", emphasis: true, span: { label: "DESC" }, mark: false },
      { text: " d", emphasis: false, span: { label: "DESC" }, mark: false },
      { text: ".", emphasis: false, span: null, mark: false },
    ]);
  });

  it("rend l'empan lui-même : le même pour ses segments, distinct de son voisin", () => {
    const desc = span("DESC", 6, 10);
    const cut = segments("A, *b c* d.", [desc]);
    expect(cut[2]?.span).toBe(desc);
    expect(cut[3]?.span).toBe(desc);
    const [a, b] = [span("SUBJ", 0, 1), span("SUBJ", 1, 2)];
    expect(segments("ab", [a, b]).map((s) => s.span)).toEqual([a, b]);
  });

  it("affiche un astérisque échappé sans changer l'emphase", () => {
    expect(segments("8 \\*", [])).toMatchObject([
      { text: "8 *", emphasis: false, span: null, mark: false },
    ]);
  });

  it("compte les positions en points de code", () => {
    // « 𝔄 » tient deux unités UTF-16 mais un seul point de code
    expect(segments("𝔄 b", [span("SUBJ", 2, 3)])).toMatchObject([
      { text: "𝔄 ", emphasis: false, span: null, mark: false },
      { text: "b", emphasis: false, span: { label: "SUBJ" }, mark: false },
    ]);
  });

  it("garde les retours à la ligne", () => {
    expect(segments("a.\nb.", [])).toMatchObject([
      { text: "a.\nb.", emphasis: false, span: null, mark: false },
    ]);
  });
});

describe("segments et correspondances", () => {
  it("découpe aux bornes des correspondances, à travers l'emphase et les empans", () => {
    // « Bonardot (*de la Paix*) » : « la paix » coupe l'emphase et l'empan DESC
    expect(
      segments("Bonardot (*de la Paix*)", [span("DESC", 9, 23)], [{ charStart: 14, charEnd: 21 }]),
    ).toMatchObject([
      { text: "Bonardot ", emphasis: false, span: null, mark: false },
      { text: "(", emphasis: false, span: { label: "DESC" }, mark: false },
      { text: "de ", emphasis: true, span: { label: "DESC" }, mark: false },
      { text: "la Paix", emphasis: true, span: { label: "DESC" }, mark: true },
      { text: ")", emphasis: false, span: { label: "DESC" }, mark: false },
    ]);
  });

  it("garde deux correspondances voisines séparées", () => {
    const marks = [
      { charStart: 0, charEnd: 2 },
      { charStart: 2, charEnd: 4 },
    ];
    expect(segments("aaaa", [], marks)).toMatchObject([
      { text: "aa", emphasis: false, span: null, mark: true },
      { text: "aa", emphasis: false, span: null, mark: true },
    ]);
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
