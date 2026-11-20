// Découpe du texte imprimé d'un nœud en segments à rendre (docs/composants/noeud-liste.md).
// Le texte de numrev porte l'emphase en Markdown (`*en gros*`, `\*` pour un astérisque) ; les
// empans y sont repérés en points de code du texte brut, marques comprises. Emphase et empans
// ne s'emboîtent pas toujours (un empan peut commencer au milieu d'une emphase) : on découpe
// aux bornes des deux.

import type { Span, SpanLabel } from "../query/types.ts";

export interface Segment {
  /** Texte à afficher, sans marques d'emphase. */
  text: string;
  emphasis: boolean;
  /** Empan auquel appartient le segment, s'il y en a un. */
  span: { label: SpanLabel } | null;
}

/** Segments consécutifs de même emphase et de même empan, dans l'ordre du texte. */
export function segments(
  text: string,
  spans: readonly Pick<Span, "label" | "charStart" | "charEnd">[],
): Segment[] {
  const chars = Array.from(text); // points de code, comme les positions des empans
  const result: Segment[] = [];
  let emphasis = false;
  // empan du dernier segment : deux empans voisins de même libellé restent distincts
  let current: (typeof spans)[number] | undefined;
  for (let i = 0; i < chars.length; i++) {
    let char = chars[i] as string;
    if (char === "\\" && (chars[i + 1] === "*" || chars[i + 1] === "\\")) {
      i++; // caractère échappé : affiché tel quel, la barre oblique disparaît
      char = chars[i] as string;
    } else if (char === "*") {
      emphasis = !emphasis;
      continue;
    }
    const found = spans.find((s) => s.charStart <= i && i < s.charEnd);
    const last = result.at(-1);
    if (last && last.emphasis === emphasis && current === found) {
      last.text += char;
    } else {
      result.push({ text: char, emphasis, span: found ? { label: found.label } : null });
      current = found;
    }
  }
  return result;
}

/** Texte tel qu'on le lit, sur une ligne : sans marques d'emphase, blancs réduits à une espace. */
export function plainText(text: string): string {
  return segments(text, [])
    .map((s) => s.text)
    .join("")
    .replace(/\s+/g, " ");
}
