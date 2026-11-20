// Vue Liste (docs/composants/noeud-liste.md) : la sélection dans ses rubriques, à plat. Toute
// section, contexte compris, est un groupe marqué par son guide de niveau ; tout nœud est le
// même élément, une ligne (chevron, texte, lien | page) qui déplie sa fiche juste dessous, par
// <details> natif, sans script.

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { serializeQuery } from "../lib/query/query.ts";
import type { SubgraphNode } from "../lib/query/types.ts";
import { ChevronIcon, OpenIcon } from "./icons.tsx";
import { NodeDetail } from "./NodeDetail.tsx";
import { PrintedText } from "./PrintedText.tsx";

/**
 * `context` : rubriques ancêtres de la sélection qui n'en font pas partie ; `nodes` : la
 * sélection. Une sélection d'un seul nœud le montre déplié.
 */
export function NodeList({ context, nodes }: { context: SubgraphNode[]; nodes: SubgraphNode[] }) {
  const shown = [...context, ...nodes].sort(
    (a, b) => a.documentReadingOrder - b.documentReadingOrder,
  );
  const ids = new Set(shown.map((n) => n.id));
  // enfants de chaque nœud montré, dans l'ordre de lecture ; null : les nœuds sans parent montré
  const children = Map.groupBy(shown, (n) =>
    n.parentId !== null && ids.has(n.parentId) ? n.parentId : null,
  );
  const opened = nodes.length === 1 ? nodes[0]?.id : undefined;

  // un nœud et, pour une section, son groupe ; `path` : ses rubriques montrées, de la racine au
  // parent (chemin de sa fiche, profondeur de son groupe)
  const render = (n: SubgraphNode, path: SubgraphNode[]): ReactNode => {
    const item = <Item key={n.id} node={n} path={path} open={n.id === opened} />;
    if (n.kind !== "section") return item;
    return (
      <section
        key={n.id}
        className="group"
        aria-labelledby={`text-${n.id}`}
        style={{ "--depth": path.length } as CSSProperties}
      >
        {item}
        {children.get(n.id)?.map((c) => render(c, [...path, n]))}
      </section>
    );
  };

  return (
    <>
      <div className="columns" aria-hidden="true">
        <span />
        <span className="page">Page</span>
      </div>
      {children.get(null)?.map((n) => render(n, []))}
    </>
  );
}

/** Un nœud, quel que soit son type : seul son texte change. */
function Item({ node, path, open }: { node: SubgraphNode; path: SubgraphNode[]; open: boolean }) {
  return (
    <details className="item" open={open}>
      <summary className="line" aria-labelledby={`text-${node.id}`}>
        <span className={`text text-${node.kind}`}>
          <ChevronIcon className="chevron" />
          {/* nom de la ligne : son texte seul, sans le lien */}
          <span id={`text-${node.id}`} className="label">
            {node.kind === "out_of_scope" && (
              <span className="visually-hidden">Out of scope: </span>
            )}
            <PrintedText text={node.text} spans={node.spans} />
          </span>
          {/* nouvelle sélection : ce nœud seul (une section avec sa descendance) ; décrit par le
              texte de la ligne, pour distinguer les liens entre eux */}
          <Link
            className="own-page"
            href={`/?${serializeQuery({ subtree: [node.id] })}`}
            aria-label="Open on its own page"
            aria-describedby={`text-${node.id}`}
            title="Open on its own page"
          >
            <OpenIcon />
          </Link>
        </span>
        <span className="page">{node.anchors[0]?.page}</span>
      </summary>
      <div className="detail">
        <NodeDetail node={node} context={path} />
      </div>
    </details>
  );
}
