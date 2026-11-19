// Fiche d'un nœud dans la vue Liste : densité détaillée, en clé / valeur — texte, champs,
// métadonnées —, puis le fil d'Ariane ; dépliée sous sa ligne (docs/composants/noeud-liste.md).

import Link from "next/link";
import { serializeQuery } from "../lib/query/query.ts";
import type { Anchor, NodeKind, SpanLabel, SubgraphNode } from "../lib/query/resolve.ts";
import { PrintedText } from "./PrintedText.tsx";

const KIND_LABELS: Record<NodeKind, string> = {
  entry: "Entry",
  section: "Section",
  out_of_scope: "Out of scope",
};

const FIELD_LABELS: Record<SpanLabel, string> = {
  SUBJ: "Subject",
  DESC: "Description",
  ADDR: "Address",
};

export function NodeDetail({ node, context }: { node: SubgraphNode; context: SubgraphNode[] }) {
  return (
    <article className="node-detail">
      <dl>
        <div>
          <dt>Text</dt>
          <dd>
            <PrintedText text={node.text} />
          </dd>
        </div>
      </dl>
      {node.spans.length > 0 && (
        <dl>
          {/* un champ par empan, dans l'ordre du texte (répétés pour un groupe à accolade) */}
          {node.spans.map((span) => (
            <div key={span.id}>
              <dt>{FIELD_LABELS[span.label]}</dt>
              <dd lang="fr">{span.normalized}</dd>
            </div>
          ))}
        </dl>
      )}
      <dl className="meta">
        <div>
          <dt>Type</dt>
          <dd>{KIND_LABELS[node.kind]}</dd>
        </div>
        <div>
          <dt>Source</dt>
          <dd>{pages(node.anchors)}</dd>
        </div>
        <div>
          <dt>Identifier</dt>
          <dd>
            <code className="identifier">{node.id}</code>
          </dd>
        </div>
      </dl>
      {context.length > 0 && (
        <nav aria-label="Sections">
          <ol className="breadcrumb">
            {context.map((section) => (
              <li key={section.id}>
                <Link href={`/?${serializeQuery({ subtree: section.id })}`}>
                  <PrintedText text={section.text} />
                </Link>
              </li>
            ))}
          </ol>
        </nav>
      )}
    </article>
  );
}

/** « p. 60 », « pp. 60–61 », « pp. 60, 62 » ; « unknown page » sans ancre. */
function pages(anchors: readonly Anchor[]): string {
  const numbers = anchors.map((a) => a.page);
  const [first] = numbers;
  if (first === undefined) return "unknown page";
  if (numbers.length === 1) return `p. ${first}`;
  const consecutive = numbers.every((n, i) => n === first + i);
  const last = numbers.at(-1);
  return consecutive ? `pp. ${first}–${last}` : `pp. ${numbers.join(", ")}`;
}
