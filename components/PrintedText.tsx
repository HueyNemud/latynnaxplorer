// Texte imprimé d'un nœud, tel que numrev le donne : emphase en italique, chaque empan précédé
// d'un badge (subj, desc, loc) et marqué d'un fin soulignement de la couleur de son libellé
// (docs/composants/noeud-liste.md).

import { Fragment, type ReactNode } from "react";
import type { Span, SpanLabel } from "../lib/query/resolve.ts";
import { segments } from "../lib/text/segments.ts";

const BADGES: Record<SpanLabel, string> = { SUBJ: "subj", DESC: "desc", ADDR: "loc" };

export function PrintedText({ text, spans = [] }: { text: string; spans?: readonly Span[] }) {
  let previous: string | undefined; // empan du segment précédent
  return (
    <span lang="fr" className="printed">
      {segments(text, spans).map((segment, i) => {
        let content: ReactNode = segment.text;
        if (segment.emphasis) content = <em>{content}</em>;
        if (segment.span) {
          const kind = segment.span.label.toLowerCase();
          content = <span className={`field field-${kind}`}>{content}</span>;
          // badge au début de l'empan seulement (un empan peut compter plusieurs segments)
          if (segment.span.id !== previous) {
            content = (
              <>
                <span className={`badge badge-${kind}`} lang="en">
                  {BADGES[segment.span.label]}
                </span>
                {content}
              </>
            );
          }
        }
        previous = segment.span?.id;
        // segments sans identité propre, recalculés à chaque rendu : l'index suffit
        // biome-ignore lint/suspicious/noArrayIndexKey: liste statique
        return <Fragment key={i}>{content}</Fragment>;
      })}
    </span>
  );
}
