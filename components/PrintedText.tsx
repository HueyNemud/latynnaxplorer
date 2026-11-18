// Texte imprimé d'un nœud, tel que numrev le donne : emphase en italique, chaque empan marqué
// d'un fin soulignement de la couleur de son libellé (docs/composants/noeud-liste.md).

import { Fragment, type ReactNode } from "react";
import type { Span } from "../lib/query/resolve.ts";
import { segments } from "../lib/text/segments.ts";

export function PrintedText({ text, spans = [] }: { text: string; spans?: readonly Span[] }) {
  return (
    <span lang="fr" className="printed">
      {segments(text, spans).map((segment, i) => {
        let content: ReactNode = segment.text;
        if (segment.emphasis) content = <em>{content}</em>;
        if (segment.span) {
          content = <span className={fieldClass(segment.span.label)}>{content}</span>;
        }
        // segments sans identité propre, recalculés à chaque rendu : l'index suffit
        // biome-ignore lint/suspicious/noArrayIndexKey: liste statique
        return <Fragment key={i}>{content}</Fragment>;
      })}
    </span>
  );
}

export function fieldClass(label: Span["label"]): string {
  return `field field-${label.toLowerCase()}`;
}
