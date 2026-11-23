// Fiche d'un nœud, dépliée sous sa ligne dans la vue Liste (docs/composants/noeud-liste.md) :
// texte, empans et métadonnées en clé / valeur (DataList de Radix), puis son chemin, en texte
// (seules les facettes changent la sélection).

import { DataList } from "@radix-ui/themes";
import type { NodeKind, SpanLabel, SubgraphNode } from "../lib/query/types.ts";
import { pages } from "../lib/text/pages.ts";
import { PrintedText } from "./PrintedText.tsx";

const KIND_LABELS: Record<NodeKind, string> = {
  entry: "Entry",
  section: "Section",
  out_of_scope: "Out of scope",
};

const SPAN_LABELS: Record<SpanLabel, string> = {
  SUBJ: "Subject",
  DESC: "Description",
  ADDR: "Address",
};

/** Largeur de la colonne des clés, la même pour les trois listes. */
const LABEL_WIDTH = "7rem";

export function NodeDetail({
  node,
  path,
}: {
  node: SubgraphNode;
  /** son chemin : les rubriques au-dessus de lui, de la racine à son parent */
  path: SubgraphNode[];
}) {
  return (
    <article className="node-detail">
      <DataList.Root size="3" className="detail-group">
        <DataList.Item>
          <DataList.Label minWidth={LABEL_WIDTH}>Text</DataList.Label>
          <DataList.Value>
            <PrintedText text={node.text} />
          </DataList.Value>
        </DataList.Item>
      </DataList.Root>
      {node.spans.length > 0 && (
        <DataList.Root size="3" className="detail-group">
          {/* un par empan (libellés répétés pour un groupe à accolade) */}
          {node.spans.map((span, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: liste statique
            <DataList.Item key={i}>
              <DataList.Label minWidth={LABEL_WIDTH}>{SPAN_LABELS[span.label]}</DataList.Label>
              <DataList.Value lang="fr">{span.normalized}</DataList.Value>
            </DataList.Item>
          ))}
        </DataList.Root>
      )}
      <DataList.Root size="2" className="detail-group">
        <DataList.Item>
          <DataList.Label minWidth={LABEL_WIDTH}>Type</DataList.Label>
          <DataList.Value>{KIND_LABELS[node.kind]}</DataList.Value>
        </DataList.Item>
        <DataList.Item>
          <DataList.Label minWidth={LABEL_WIDTH}>Source</DataList.Label>
          <DataList.Value>{pages(node.anchors.map((a) => a.page))}</DataList.Value>
        </DataList.Item>
        <DataList.Item>
          <DataList.Label minWidth={LABEL_WIDTH}>Identifier</DataList.Label>
          <DataList.Value>
            <code className="identifier">{node.id}</code>
          </DataList.Value>
        </DataList.Item>
      </DataList.Root>
      {path.length > 0 && (
        <nav aria-label="Sections">
          <ol className="path">
            {path.map((section) => (
              <li key={section.id}>
                <PrintedText text={section.text} />
              </li>
            ))}
          </ol>
        </nav>
      )}
    </article>
  );
}
