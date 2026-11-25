"use client";

// Facettes de structure (docs/composants/facettes.md) : panneaux Volumes et Contents ; règles des
// cases dans lib/facets/selection.ts. Les cases cochées sont l'état de ce composant, lu une fois
// depuis l'URL, que l'URL suit ; elles appartiennent au formulaire de la recherche (attribut
// `form`). Le volume au focus est celui de la requête ; cliquer une vignette en change dans l'URL,
// la page (components/Explorer.tsx) le charge, puis remonte les facettes.

import { ChevronRightIcon } from "@radix-ui/react-icons";
import { Button, Card, Checkbox, Flex, Spinner } from "@radix-ui/themes";
import { memo, type ReactNode, useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  checkedOf,
  coveredBy,
  keepOnly,
  pathTo,
  sectionTree,
  toggleSection,
  toggleVolume,
  volumeState,
} from "../lib/facets/selection.ts";
import { type Query, queryUrl } from "../lib/query/query.ts";
import type { FacetSection, Volume } from "../lib/query/types.ts";
import { volumeName } from "../lib/query/volume.ts";
import { plainText } from "../lib/text/segments.ts";
import { Panel } from "./Panel.tsx";
import { QUERY_FORM, usePagePath } from "./SearchForm.tsx";

interface FacetsProps {
  /** tous les volumes de l'index */
  volumes: Volume[];
  /** les rubriques du volume de la sélection affichée */
  sections: FacetSection[];
  /** la requête de la sélection affichée : ses `subtree` sont les rubriques cochées les plus
   * hautes ; son texte est gardé quand les cases ou le volume changent */
  query: Query;
  /** le volume au focus, celui de la requête */
  focus: string;
  /** le volume au focus est chargé : `sections` sont les siennes */
  ready: boolean;
}

/**
 * Les cases cochées ne sont lues dans la requête qu'une fois : une requête qui n'en diffère que
 * par ses rubriques (l'URL qui suit les cases), aux mêmes décomptes, ne change rien aux facettes.
 */
function sameFacets(a: FacetsProps, b: FacetsProps): boolean {
  return (
    a.volumes === b.volumes &&
    a.focus === b.focus &&
    a.ready === b.ready &&
    a.query.text === b.query.text &&
    a.query.zones?.join() === b.query.zones?.join() &&
    a.sections.length === b.sections.length &&
    a.sections.every((s, i) => s.id === b.sections[i]?.id && s.entries === b.sections[i]?.entries)
  );
}

export const Facets = memo(function Facets({
  volumes,
  sections,
  query,
  focus,
  ready,
}: FacetsProps) {
  const tree = useMemo(() => sectionTree(sections), [sections]);
  // les rubriques cochées, lues une fois depuis l'URL
  const [checked, setChecked] = useState(() => checkedOf(tree, query.subtree ?? []));
  // à l'arrivée, le chemin des rubriques cochées est déplié
  const [open] = useState(() => pathTo(tree, checked));

  // appliquer : l'URL suit les cases, 100 ms après le dernier clic (des clics rapides donnent un
  // seul calcul) ; la Liste est estompée dès le clic, jusqu'à la nouvelle sélection
  const pathname = usePagePath();
  const [computing, startTransition] = useTransition();
  const [waiting, setWaiting] = useState(false);
  const loading = waiting || computing;
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const select = (next: Set<string>) => {
    setChecked(next);
    setWaiting(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const url = queryUrl(pathname, { ...query, subtree: [...next] });
      startTransition(() => {
        setWaiting(false);
        window.history.replaceState(null, "", url);
      });
    }, 100);
  };
  // panneaux ouverts : toujours les premiers (Volumes, puis Contents) ; ouvrir un panneau ouvre
  // ceux des niveaux au-dessus, en replier un replie ceux des niveaux en dessous
  const [panels, setPanels] = useState(2);
  const panel = (level: number) => ({
    open: level < panels,
    onToggle: () => setPanels(level < panels ? level : level + 1),
  });

  // rubriques cochées en partie : une rubrique en dessous d'elles est cochée
  const partial = useMemo(() => pathTo(tree, checked), [tree, checked]);

  const row = (s: FacetSection): ReactNode => {
    const kids = tree.children.get(s.id) ?? [];
    const cover = coveredBy(tree, checked, s.id);
    const label = plainText(s.text);
    const line = (
      <>
        {kids.length > 0 && <ChevronRightIcon className="chevron" aria-hidden="true" />}
        <Checkbox
          size="1"
          // couverte : cochée en pâle, sans nom (pas envoyée) ; un clic ne garde qu'elle
          variant={cover ? "soft" : "surface"}
          form={QUERY_FORM}
          name={cover ? undefined : "subtree"}
          value={s.id}
          checked={
            cover !== undefined || checked.has(s.id) || (partial.has(s.id) && "indeterminate")
          }
          onCheckedChange={() =>
            select(cover ? keepOnly(tree, checked, s.id) : toggleSection(tree, checked, s.id))
          }
          aria-label={label}
          title={
            cover ? `Keep only this section (included in: ${plainText(cover.text)})` : undefined
          }
        />
        <span id={`tree-${s.id}`} className="tree-label" lang="fr" title={label}>
          {label}
        </span>
        <span className="tree-count">{s.entries.toLocaleString("en")}</span>
      </>
    );
    return (
      <li key={s.id}>
        {kids.length > 0 ? (
          <details open={open.has(s.id)}>
            {/* nommé par son intitulé seul, sans la case ni le décompte */}
            <summary className="row tree-line" aria-labelledby={`tree-${s.id}`}>
              {line}
            </summary>
            <ul className="tree">{kids.map(row)}</ul>
          </details>
        ) : (
          <div className="row tree-line">{line}</div>
        )}
      </li>
    );
  };

  return (
    <section className="facets" aria-label="Selection" aria-busy={loading}>
      <Panel id="volumes" title="Volumes" {...panel(0)}>
        <div className="volume-cards">
          {volumes.map((v) => {
            const year = v.temporalStart.slice(0, 4);
            const name = volumeName(v);
            return (
              <div key={v.id} className="volume-card" data-focus={v.id === focus || undefined}>
                <Card asChild variant="classic" className="volume-thumb">
                  <button
                    type="button"
                    aria-pressed={v.id === focus}
                    aria-label={`Show the contents of ${name}`}
                    // le volume au focus : ouvre Contents ; un autre : la même recherche, sans
                    // les rubriques de celui-ci (les facettes remontées rouvrent Contents)
                    onClick={() => {
                      if (v.id === focus) return setPanels(2);
                      const { text, zones } = query;
                      window.history.pushState(
                        null,
                        "",
                        queryUrl(pathname, { volume: v.id, text, zones }),
                      );
                    }}
                  >
                    <span className="volume-year">{year}</span>
                    <span className="volume-name">{v.title ?? v.id}</span>
                  </button>
                </Card>
                {v.id === focus && (
                  <Checkbox
                    size="3"
                    className="volume-box"
                    checked={volumeState(tree, checked)}
                    disabled={!ready}
                    onCheckedChange={() => select(toggleVolume(tree, checked))}
                    aria-label={`Select all of ${name}`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </Panel>
      <Panel id="contents" title="Contents" {...panel(1)}>
        {ready ? (
          <>
            {/* plus aucune rubrique cochée ; inactif quand il ne changerait rien */}
            <div className="facet-actions">
              <Button
                variant="soft"
                disabled={checked.size === 0}
                onClick={() => select(new Set())}
              >
                Clear
              </Button>
            </div>
            <ul className="tree tree-root">{(tree.children.get(null) ?? []).map(row)}</ul>
          </>
        ) : (
          <Flex justify="center" p="4">
            <Spinner />
          </Flex>
        )}
      </Panel>
    </section>
  );
}, sameFacets);
