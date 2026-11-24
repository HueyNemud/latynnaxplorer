// Correspondances du texte cherché dans le texte d'un nœud, à surligner (docs/composants/
// noeud-liste.md) : les mêmes que celles qui le sélectionnent (lib/query/resolve.ts, matcher),
// texte plié et zones fouillées, ramenées à des positions du texte brut. Fonction pure.

import { fold } from "../query/fold.ts";
import type { Query } from "../query/query.ts";
import type { Span } from "../query/types.ts";
import { zonePieces } from "../query/volume.ts";

/** Une correspondance : positions dans le texte brut, en points de code, fin exclue. */
export interface Match {
  charStart: number;
  charEnd: number;
}

/**
 * Correspondances du texte cherché dans `text`, dans l'ordre du texte, sans chevauchement :
 * cherchées dans chaque morceau des zones fouillées (un empan, ou un passage hors empan), comme
 * la sélection ; sans zone, dans tout le texte. Une lettre que le pliage décompose (« Œ » en
 * « oe ») est prise entière dès qu'une correspondance la touche.
 */
export function matches(
  text: string,
  spans: readonly Pick<Span, "label" | "charStart" | "charEnd">[],
  { text: searched, zones }: Pick<Query, "text" | "zones">,
): Match[] {
  const needle = fold(searched ?? "");
  if (needle === "") return [];
  // chaque point de code plié à part : mis bout à bout, ils font fold(text)
  const folded = Array.from(text, fold);
  const result: Match[] = [];
  for (const [start, end] of zonePieces(folded.length, spans, zones)) {
    // texte plié du morceau, et le point de code d'où vient chacune de ses unités
    let haystack = "";
    const from: number[] = [];
    for (let i = start; i < end; i++) {
      const f = folded[i] as string;
      haystack += f;
      for (let k = 0; k < f.length; k++) from.push(i);
    }
    for (let at = haystack.indexOf(needle); at !== -1; at = haystack.indexOf(needle, at)) {
      let charEnd = (from[at + needle.length - 1] as number) + 1;
      // les signes que le pliage efface (accents décomposés) restent avec leur lettre
      while (charEnd < end && folded[charEnd] === "") charEnd++;
      result.push({ charStart: from[at] as number, charEnd });
      at += needle.length;
    }
  }
  return result.sort((a, b) => a.charStart - b.charStart);
}
