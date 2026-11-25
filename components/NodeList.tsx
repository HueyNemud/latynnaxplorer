// Vue Liste (docs/composants/noeud-liste.md) : la sélection dans ses rubriques, à plat, montrée
// par tranches ; tout nœud est une ligne qui déplie sa fiche juste dessous (<details> natif).

import { ChevronRightIcon } from "@radix-ui/react-icons";
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
import { withContext } from "../lib/query/explore.ts";
import type { Query } from "../lib/query/query.ts";
import type { SubgraphNode } from "../lib/query/types.ts";
import type { LoadedVolume } from "../lib/query/volume.ts";
import { matches } from "../lib/text/matches.ts";
import { NodeDetail } from "./NodeDetail.tsx";
import { PrintedText } from "./PrintedText.tsx";

/** Nœuds sélectionnés par tranche. */
const STEP = 200;

/**
 * `selection` : les nœuds sélectionnés, dans l'ordre de lecture ; `volume` : leur volume, d'où
 * la Liste tire le contexte ; `search` : le
 * texte cherché et ses zones, surligné dans les lignes.
 */
export function NodeList({
  selection,
  volume,
  search,
}: {
  selection: SubgraphNode[];
  volume: LoadedVolume;
  search: Search;
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
    () => withContext(volume, selection.slice(0, count)),
    [volume, selection, count],
  );
  // une sélection d'un seul nœud : montré déplié
  const opened = selection.length === 1 ? selection[0]?.id : undefined;

  const ids = new Set(shown.map((n) => n.id));
  // enfants de chaque nœud montré, dans l'ordre de lecture ; null : les nœuds sans parent montré
  const children = Map.groupBy(shown, (n) =>
    n.parentId !== null && ids.has(n.parentId) ? n.parentId : null,
  );

  // un nœud et, pour une rubrique, son contenu ; `path` : son chemin (rubriques montrées, de la
  // racine au parent), qui donne aussi sa profondeur
  const render = (n: SubgraphNode, path: SubgraphNode[]): ReactNode => {
    const node = (
      <ListNode key={n.id} node={n} path={path} open={n.id === opened} search={search} />
    );
    if (n.kind !== "section") return node;
    return (
      <section
        key={n.id}
        className="section"
        aria-labelledby={`text-${n.id}`}
        style={{ "--depth": path.length } as CSSProperties}
      >
        {node}
        {children.get(n.id)?.map((c) => render(c, [...path, n]))}
      </section>
    );
  };

  return (
    <>
      {/* en-tête : le décompte de la sélection (les lignes de l'export, pas le contexte), puis le
          titre de la colonne des pages */}
      <div className="columns">
        <span>{selection.length.toLocaleString("en")} selected</span>
        <span className="page" aria-hidden="true">
          Page
        </span>
      </div>
      {children.get(null)?.map((n) => render(n, []))}
      {count < selection.length && <More key={count} onVisible={more} />}
    </>
  );
}

/** Texte cherché et zones fouillées, dont la Liste surligne les correspondances. */
type Search = Pick<Query, "text" | "zones">;

/**
 * Un nœud, quel que soit son type : seul son texte change. Sa fiche est rendue au premier
 * dépliage, puis gardée. Rendu une fois par texte cherché : une tranche de plus ne rend que ses
 * nœuds (son chemin ne dépend que du nœud).
 */
const ListNode = memo(
  function ListNode({
    node,
    path,
    open,
    search,
  }: {
    node: SubgraphNode;
    path: SubgraphNode[];
    open: boolean;
    search: Search;
  }) {
    const [unfolded, setUnfolded] = useState(open);
    return (
      <details
        className="node"
        open={open}
        onToggle={(event) => event.currentTarget.open && setUnfolded(true)}
      >
        <summary className="row line" aria-labelledby={`text-${node.id}`}>
          <span className={`text text-${node.kind}`}>
            <ChevronRightIcon className="chevron" aria-hidden="true" />
            <span id={`text-${node.id}`} className="label">
              {node.kind === "out_of_scope" && (
                <span className="visually-hidden">Out of scope: </span>
              )}
              <PrintedText
                text={node.text}
                spans={node.spans}
                matches={matches(node.text, node.spans, search)}
              />
            </span>
          </span>
          <span className="page">{node.anchors[0]?.page}</span>
        </summary>
        <div className="detail">{unfolded && <NodeDetail node={node} path={path} />}</div>
      </details>
    );
  },
  (a, b) =>
    a.node === b.node &&
    a.open === b.open &&
    a.search.text === b.search.text &&
    a.search.zones?.join() === b.search.zones?.join(),
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
