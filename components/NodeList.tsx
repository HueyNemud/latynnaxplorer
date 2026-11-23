// Vue Liste (docs/composants/noeud-liste.md) : la sélection dans ses rubriques, à plat. Toute
// section, contexte compris, est un groupe marqué par son guide de niveau ; tout nœud est le
// même élément, une ligne qui déplie sa fiche juste dessous (<details> natif). La fiche n'est
// rendue qu'au premier dépliage (components/NodeDetails.tsx), sauf pour une sélection d'un seul
// nœud, dépliée d'emblée.
// La sélection est montrée par tranches : la première, puis la suivante chaque fois que le bas de
// la Liste approche (à un écran près) ; une autre sélection repart de la première.

import {
  type CSSProperties,
  memo,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { detail, withContext } from "../lib/query/explore.ts";
import type { SubgraphNode } from "../lib/query/types.ts";
import type { LoadedVolume } from "../lib/query/volume.ts";
import { ChevronIcon } from "./icons.tsx";
import { NodeDetail } from "./NodeDetail.tsx";
import { NodeDetails } from "./NodeDetails.tsx";
import { PrintedText } from "./PrintedText.tsx";

/** Nœuds sélectionnés par tranche : la première est montrée en moins de 100 ms. */
const STEP = 200;

/**
 * `selection` : les nœuds sélectionnés, volume après volume, chacun dans l'ordre de lecture ;
 * `volumes` : les volumes chargés, d'où la Liste tire le contexte et les fiches.
 */
export function NodeList({
  selection,
  volumes,
}: {
  selection: SubgraphNode[];
  volumes: readonly LoadedVolume[];
}) {
  // nombre de nœuds sélectionnés montrés, pour cette sélection ; une autre repart d'une tranche
  const [shownOf, setShownOf] = useState({ selection, count: STEP });
  const count = shownOf.selection === selection ? shownOf.count : STEP;
  const more = useCallback(
    () => setShownOf({ selection, count: count + STEP }),
    [selection, count],
  );
  // les nœuds montrés et leur contexte (rubriques ancêtres)
  const shown = useMemo(
    () => withContext(volumes, selection.slice(0, count)),
    [volumes, selection, count],
  );
  // une sélection d'un seul nœud : montré déplié
  const opened = selection.length === 1 ? selection[0]?.id : undefined;
  const detailOf = useCallback((id: string) => detail(volumes, id), [volumes]);

  const ids = new Set(shown.map((n) => n.id));
  // enfants de chaque nœud montré, dans l'ordre de lecture ; null : les nœuds sans parent montré
  const children = Map.groupBy(shown, (n) =>
    n.parentId !== null && ids.has(n.parentId) ? n.parentId : null,
  );

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
      {count < selection.length && <More key={count} onVisible={more} />}
      <NodeDetails detail={detailOf} />
    </>
  );
}

/**
 * Un nœud, quel que soit son type : seul son texte change. Rendu une fois : une tranche de plus
 * ne rend que ses nœuds (son chemin, toutes ses rubriques, ne dépend que du nœud).
 */
const Item = memo(
  function Item({ node, path, open }: { node: SubgraphNode; path: SubgraphNode[]; open: boolean }) {
    return (
      <details className="item" open={open}>
        <summary className="row line" aria-labelledby={`text-${node.id}`}>
          <span className={`text text-${node.kind}`}>
            <ChevronIcon className="chevron" />
            <span id={`text-${node.id}`} className="label">
              {node.kind === "out_of_scope" && (
                <span className="visually-hidden">Out of scope: </span>
              )}
              <PrintedText text={node.text} spans={node.spans} />
            </span>
          </span>
          <span className="page">{node.anchors[0]?.page}</span>
        </summary>
        {/* dépliée d'emblée : la fiche ; sinon une case vide, remplie au premier dépliage */}
        {open ? (
          <div className="detail">
            <NodeDetail node={node} context={path} />
          </div>
        ) : (
          <div className="detail" data-node={node.id} />
        )}
      </details>
    );
  },
  (a, b) => a.node === b.node && a.open === b.open,
);

/**
 * Fin d'une Liste incomplète : appelle `onVisible` quand elle est à moins d'un écran du bas de la
 * zone qui défile (`.view-scroll`, components/Explorer.tsx). Une instance par tranche (clé), dont
 * l'observation commence par l'état présent : la tranche suivante suit si la fin reste proche.
 */
function More({ onVisible }: { onVisible: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const end = ref.current;
    if (end === null) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) onVisible();
      },
      { root: end.closest(".view-scroll"), rootMargin: "0px 0px 100% 0px" },
    );
    observer.observe(end);
    return () => observer.disconnect();
  }, [onVisible]);
  return <div ref={ref} aria-hidden="true" />;
}
