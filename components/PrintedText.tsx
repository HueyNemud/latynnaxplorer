// Texte imprimé d'un nœud, tel que numrev le donne : emphase en italique, chaque empan dans un
// seul élément `span-<libellé>` (fond coloré dans une ligne de la vue Liste,
// docs/composants/noeud-liste.md), même coupé par l'emphase ou une correspondance ; chaque
// correspondance du texte cherché dans un <mark>.

import { Fragment, type ReactNode } from "react";
import type { Span } from "../lib/query/types.ts";
import type { Match } from "../lib/text/matches.ts";
import { type Segment, segments } from "../lib/text/segments.ts";

export function PrintedText({
  text,
  spans = [],
  matches = [],
}: {
  text: string;
  spans?: readonly Span[];
  matches?: readonly Match[];
}) {
  // segments consécutifs d'un même empan, ou hors empan
  const runs: { span: Segment["span"]; segments: Segment[] }[] = [];
  for (const segment of segments(text, spans, matches)) {
    const last = runs.at(-1);
    if (last && last.span === segment.span) last.segments.push(segment);
    else runs.push({ span: segment.span, segments: [segment] });
  }
  // morceaux sans identité propre, recalculés à chaque rendu : l'index suffit
  return (
    <span lang="fr" className="printed">
      {runs.map(({ span, segments }, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: liste statique
        <Fragment key={i}>
          {span ? (
            <span className={`span span-${span.label.toLowerCase()}`}>{segments.map(inline)}</span>
          ) : (
            segments.map(inline)
          )}
        </Fragment>
      ))}
    </span>
  );
}

/** Un segment : son texte, en italique s'il est emphatique, marqué s'il est une correspondance. */
function inline(segment: Segment, i: number): ReactNode {
  let content: ReactNode = segment.text;
  if (segment.emphasis) content = <em>{content}</em>;
  if (segment.mark) content = <mark>{content}</mark>;
  return <Fragment key={i}>{content}</Fragment>;
}
