// Vue Liste (docs/composants/noeud-liste.md) : la sélection dans ses rubriques. Toute section,
// contexte compris, est une carte ; tout nœud est le même élément, une ligne (texte | Open |
// page) qui déplie sa fiche juste dessous, par <details> natif, sans script.

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { serializeQuery } from "../lib/query/query.ts";
import type { SubgraphNode } from "../lib/query/resolve.ts";
import { NodeDetail } from "./NodeDetail.tsx";
import { PrintedText } from "./PrintedText.tsx";

/**
 * `context` : rubriques ancêtres de la sélection, de la racine au parent ; `nodes` : la
 * sélection, dans l'ordre de lecture. Une sélection d'un seul nœud le montre déplié.
 */
export function NodeList({ context, nodes }: { context: SubgraphNode[]; nodes: SubgraphNode[] }) {
  const byId = new Map([...context, ...nodes].map((n) => [n.id, n]));
  // enfants de chaque nœud montré, dans l'ordre de lecture ; null : les nœuds sans parent montré
  const children = new Map<string | null, SubgraphNode[]>();
  for (const n of byId.values()) {
    const key = n.parentId !== null && byId.has(n.parentId) ? n.parentId : null;
    const siblings = children.get(key);
    if (siblings) siblings.push(n);
    else children.set(key, [n]);
  }
  const opened = nodes.length === 1 ? nodes[0]?.id : undefined;

  // un nœud et, pour une section, sa carte ; `path` : ses rubriques montrées, de la racine au
  // parent (chemin de sa fiche, profondeur de sa carte)
  const render = (n: SubgraphNode, path: SubgraphNode[]): ReactNode => {
    const item = <Item key={n.id} node={n} path={path} open={n.id === opened} />;
    if (n.kind !== "section") return item;
    return (
      <section
        key={n.id}
        className="card"
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
        <span />
        <span className="page">Page</span>
      </div>
      <div className="selection">{children.get(null)?.map((n) => render(n, []))}</div>
    </>
  );
}

/** Un nœud, quel que soit son type : seul son texte change. */
function Item({ node, path, open }: { node: SubgraphNode; path: SubgraphNode[]; open: boolean }) {
  return (
    <details className="item" open={open}>
      <summary className="line">
        <span id={`text-${node.id}`} className={`text text-${node.kind}`}>
          {node.kind === "out_of_scope" && <span className="visually-hidden">Out of scope: </span>}
          <PrintedText text={node.text} spans={node.spans} />
        </span>
        {/* nouvelle sélection : une section ouvre sa liste, un autre nœud sa fiche */}
        <Link className="open" href={`/?${serializeQuery({ subtree: node.id })}`}>
          Open
        </Link>
        <span className="page">{node.anchors[0]?.page}</span>
      </summary>
      <div className="detail">
        <NodeDetail node={node} context={path} />
      </div>
    </details>
  );
}
