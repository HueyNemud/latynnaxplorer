// Découpe du texte imprimé d'un nœud en segments à rendre (docs/composants/noeud-liste.md).
// Le texte de numrev porte l'emphase en Markdown (`*en gros*`, `\*` pour un astérisque) ; les
// empans y sont repérés en points de code du texte brut, marques comprises. Emphase et empans
// ne s'emboîtent pas toujours (un empan peut commencer au milieu d'une emphase) : on découpe
// aux bornes des deux, et à celles des correspondances du texte cherché (lib/text/matches.ts).

import type { Span } from "../query/types.ts";
import type { Match } from "./matches.ts";

/** Un empan, tel qu'on le découpe : son libellé et ses positions. */
type SpanRange = Pick<Span, "label" | "charStart" | "charEnd">;

export interface Segment {
  /** Texte à afficher, sans marques d'emphase. */
  text: string;
  emphasis: boolean;
  /** Empan auquel appartient le segment, s'il y en a un : celui de `spans`, le même objet pour
   * tous ses segments. */
  span: SpanRange | null;
  /** Le segment est-il dans une correspondance du texte cherché ? */
  mark: boolean;
}

/** Segments consécutifs de même emphase, de même empan et de même correspondance, dans l'ordre du
 * texte. */
export function segments(
  text: string,
  spans: readonly SpanRange[],
  matches: readonly Match[] = [],
): Segment[] {
  const chars = Array.from(text); // points de code, comme les positions des empans
  const result: Segment[] = [];
  let emphasis = false;
  // empan et correspondance du dernier segment : deux voisins restent distincts
  let current: SpanRange | undefined;
  let currentMatch: Match | undefined;
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
    const match = matches.find((m) => m.charStart <= i && i < m.charEnd);
    const last = result.at(-1);
    if (last && last.emphasis === emphasis && current === found && currentMatch === match) {
      last.text += char;
    } else {
      result.push({
        text: char,
        emphasis,
        span: found ?? null,
        mark: match !== undefined,
      });
      current = found;
      currentMatch = match;
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
