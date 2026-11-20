// Pliage du texte pour la recherche (scénario 2 de docs/SCENARIOS.md) : sans accents ni casse.

/** Lettres et signes que la décomposition NFKD ne réduit pas, ramenés à leur forme simple : ceux
 * de l'imprimé français (ligatures, tirets, apostrophes et guillemets typographiques). */
const SIMPLE: Record<string, string> = {
  Æ: "AE",
  æ: "ae",
  Œ: "OE",
  œ: "oe",
  ß: "ss",
  Ø: "O",
  ø: "o",
  Ł: "L",
  ł: "l",
  Đ: "D",
  đ: "d",
  Ð: "D",
  ð: "d",
  ı: "i",
  ſ: "s",
  "«": "<<",
  "»": ">>",
  "‹": "<",
  "›": ">",
  "‐": "-",
  "‑": "-",
  "‒": "-",
  "–": "-",
  "—": "-",
  "―": "-",
  "−": "-",
  "‘": "'",
  "’": "'",
  "‛": "'",
  "‚": ",",
  "“": '"',
  "”": '"',
  "„": ",,",
  "…": "...",
};
const SPECIAL = new RegExp(`[${Object.keys(SIMPLE).join("")}]`, "gu");

/** Texte sans accents ni casse : deux textes se comparent par leurs formes pliées. */
export function fold(text: string): string {
  return text
    .replace(SPECIAL, (c) => SIMPLE[c] ?? c)
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}
