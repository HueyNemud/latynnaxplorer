// Fiche d'un nœud dans la vue Liste : densité détaillée, en clé / valeur (DataList de Radix
// Themes) — texte, champs, métadonnées —, puis le fil d'Ariane, en texte (seules les facettes
// changent la sélection) ; dépliée sous sa ligne (docs/composants/noeud-liste.md). Rendue par le
// serveur pour une sélection d'un seul nœud, par le navigateur au dépliage sinon
// (components/NodeDetails.tsx).

import { DataList } from "@radix-ui/themes";
import type { NodeKind, SpanLabel, SubgraphNode } from "../lib/query/types.ts";
import { pages } from "../lib/text/pages.ts";
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

/** Largeur de la colonne des clés, la même pour tous les groupes. */
const LABEL_WIDTH = "7rem";

export function NodeDetail({
  node,
  context,
}: {
  node: SubgraphNode;
  /** rubriques au-dessus du nœud, de la racine à son parent */
  context: Pick<SubgraphNode, "id" | "text">[];
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
          {/* un champ par empan, dans l'ordre du texte (répétés pour un groupe à accolade) */}
          {node.spans.map((span, i) => (
            // empans sans identité propre, dans l'ordre du texte : la position suffit
            // biome-ignore lint/suspicious/noArrayIndexKey: liste statique
            <DataList.Item key={i}>
              <DataList.Label minWidth={LABEL_WIDTH}>{FIELD_LABELS[span.label]}</DataList.Label>
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
      {context.length > 0 && (
        <nav aria-label="Sections">
          <ol className="breadcrumb">
            {context.map((section) => (
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
