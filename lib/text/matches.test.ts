import { describe, expect, it } from "vitest";
import type { SpanLabel } from "../query/types.ts";
import { matches } from "./matches.ts";

const span = (label: SpanLabel, charStart: number, charEnd: number) => ({
  label,
  charStart,
  charEnd,
});
// « Dupont (de la Paix), rue de la Paix, 12. »
const TEXT = "Dupont (*de la Paix*), rue de la Paix, 12.";
const SPANS = [span("SUBJ", 0, 6), span("DESC", 7, 21), span("ADDR", 23, 42)];
const found = (text: string, query: Parameters<typeof matches>[2], spans = SPANS) =>
  matches(text, spans, query).map((m) => Array.from(text).slice(m.charStart, m.charEnd).join(""));

describe("matches", () => {
  it("rien sans texte cherché", () => {
    expect(matches(TEXT, SPANS, {})).toEqual([]);
  });

  it("toutes les correspondances, sans accents ni casse, en positions du texte brut", () => {
    expect(matches(TEXT, SPANS, { text: "PAIX" })).toEqual([
      { charStart: 15, charEnd: 19 },
      { charStart: 33, charEnd: 37 },
    ]);
    expect(found("Fabricans à Égalité, rue Égalité.", { text: "egalite" }, [])).toEqual([
      "Égalité",
      "Égalité",
    ]);
  });

  it("seulement dans les zones fouillées", () => {
    expect(matches(TEXT, SPANS, { text: "paix", zones: ["addr"] })).toEqual([
      { charStart: 33, charEnd: 37 },
    ]);
    expect(found(TEXT, { text: "paix", zones: ["subj", "other"] })).toEqual([]);
    expect(found(TEXT, { text: "rue", zones: ["other"] })).toEqual([]);
    expect(found(TEXT, { text: ",", zones: ["other"] })).toEqual([","]);
  });

  it("une correspondance ne déborde pas d'un empan sur son voisin", () => {
    // « Paix*), rue » chevauche DESC, le hors empan et ADDR : aucune zone ne le contient
    expect(found(TEXT, { text: "paix*), rue", zones: ["desc", "addr", "other"] })).toEqual([]);
    expect(found(TEXT, { text: "paix*), rue" })).toEqual(["Paix*), rue"]);
  });

  it("prend entières les lettres que le pliage décompose", () => {
    expect(found("Œuvre de la Paix…", { text: "euvre" }, [])).toEqual(["Œuvre"]);
    expect(found("Œuvre de la Paix…", { text: "paix." }, [])).toEqual(["Paix…"]);
    // accent décomposé (e + accent aigu) : gardé avec sa lettre
    expect(found("Rue Égalité.", { text: "egalite" }, [])).toEqual(["Égalité"]);
  });

  it("sans chevauchement", () => {
    expect(found("aaaa", { text: "aa" }, [])).toEqual(["aa", "aa"]);
  });
});
