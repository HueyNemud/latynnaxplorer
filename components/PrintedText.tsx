// Texte imprimé d'un nœud, tel que numrev le donne : emphase en italique, chaque empan dans un
// élément `span-<libellé>` (fond coloré dans une ligne de la vue Liste,
// docs/composants/noeud-liste.md).

import { Fragment, type ReactNode } from "react";
import type { Span } from "../lib/query/types.ts";
import { segments } from "../lib/text/segments.ts";

export function PrintedText({ text, spans = [] }: { text: string; spans?: readonly Span[] }) {
  return (
    <span lang="fr" className="printed">
      {segments(text, spans).map((segment, i) => {
        let content: ReactNode = segment.text;
        if (segment.emphasis) content = <em>{content}</em>;
        if (segment.span)
          content = (
            <span className={`span span-${segment.span.label.toLowerCase()}`}>{content}</span>
          );
        // segments sans identité propre, recalculés à chaque rendu : l'index suffit
        // biome-ignore lint/suspicious/noArrayIndexKey: liste statique
        return <Fragment key={i}>{content}</Fragment>;
      })}
    </span>
  );
}
