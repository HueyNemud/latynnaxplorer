// Fiche d'un nœud dans la vue Liste : densité détaillée (docs/composants/noeud-liste.md).

import Link from "next/link";
import { serializeQuery } from "../lib/query/query.ts";
import type {
  Anchor,
  ContextSection,
  NodeKind,
  SpanLabel,
  SubgraphNode,
} from "../lib/query/resolve.ts";
import { fieldClass, PrintedText } from "./PrintedText.tsx";

const FIELD_LABELS: Record<SpanLabel, string> = {
  SUBJ: "Subject",
  DESC: "Description",
  ADDR: "Address",
};

const KIND_LABELS: Record<NodeKind, string | null> = {
  entry: null, // le cas courant : pas de mention
  section: "Section",
  out_of_scope: "Out of scope",
};

export function NodeDetail({ node, context }: { node: SubgraphNode; context: ContextSection[] }) {
  const kind = KIND_LABELS[node.kind];
  return (
    <article className="node-detail">
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
      {kind && <p className="kind">{kind}</p>}
      <h1>
        <PrintedText text={node.text} spans={node.spans} />
      </h1>
      {node.spans.length > 0 && (
        <dl className="fields">
          {node.spans.map((span) => (
            <div key={span.id}>
              <dt>
                <span className={fieldClass(span.label)}>{FIELD_LABELS[span.label]}</span>
              </dt>
              <dd lang="fr">{span.normalized}</dd>
            </div>
          ))}
        </dl>
      )}
      <dl className="meta">
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
