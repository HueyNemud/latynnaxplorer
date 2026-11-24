"use client";

// Facettes de structure (docs/composants/facettes.md) : panneaux Volumes et Contents, en
// colonnes de Miller ; règles des cases dans lib/facets/selection.ts.
// - Les cases cochées sont l'état de ce composant, lu une fois depuis l'URL : l'URL les suit
//   après un court délai (entrée de l'historique remplacée) ; la vue est estompée pendant son
//   calcul.
// - Le volume au focus est l'état de la page (components/Explorer.tsx), qui le charge : Contents
//   attend le sien, et la case ronde d'un volume pas encore chargé est inactive.
// - Les cases font partie du formulaire de la requête (components/SearchForm.tsx) par
//   l'attribut `form` : seules partent les rubriques cochées les plus hautes (une case couverte
//   n'a pas de nom).
// - Rendues de nouveau seulement quand ce qu'elles montrent change, pas quand l'URL suit les cases.

import { Button, Card, Checkbox, Flex, Spinner } from "@radix-ui/themes";
import { memo, type ReactNode, useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  checkedOf,
  coveredBy,
  isVolumeSelected,
  keepOnly,
  pathTo,
  sectionTree,
  setVolume,
  toggleSection,
  toggleVolume,
  volumeState,
} from "../lib/facets/selection.ts";
import { type Query, queryUrl } from "../lib/query/query.ts";
import type { FacetSection, Volume } from "../lib/query/types.ts";
import { plainText } from "../lib/text/segments.ts";
import { ChevronIcon } from "./icons.tsx";
import { Panel } from "./Panel.tsx";
import { QUERY_FORM, usePagePath } from "./SearchForm.tsx";

interface FacetsProps {
  /** tous les volumes de l'index */
  volumes: Volume[];
  /** les rubriques des volumes chargés */
  sections: FacetSection[];
  /** la requête de la sélection affichée : ses `subtree` sont les rubriques cochées les plus
   * hautes ; son texte est gardé quand les cases changent */
  query: Query;
  /** le volume au focus, dont Contents montre l'arbre */
  focus: string | undefined;
  onFocus: (volumeId: string) => void;
  /** les volumes chargés, par identifiant */
  loaded: ReadonlyMap<string, unknown>;
}

/**
 * Les cases cochées ne sont lues dans la requête qu'une fois : une requête qui n'en diffère que
 * par ses rubriques (l'URL qui suit les cases), aux mêmes décomptes, ne change rien aux facettes.
 */
function sameFacets(a: FacetsProps, b: FacetsProps): boolean {
  return (
    a.volumes === b.volumes &&
    a.focus === b.focus &&
    a.onFocus === b.onFocus &&
    a.loaded === b.loaded &&
    a.query.text === b.query.text &&
    String(a.query.zones) === String(b.query.zones) &&
    a.sections.length === b.sections.length &&
    a.sections.every((s, i) => s.id === b.sections[i]?.id && s.entries === b.sections[i]?.entries)
  );
}

export const Facets = memo(function Facets({
  volumes,
  sections,
  query,
  focus,
  onFocus,
  loaded,
}: FacetsProps) {
  const tree = useMemo(() => sectionTree(sections), [sections]);
  // les rubriques cochées, lues une fois depuis l'URL
  const [checked, setChecked] = useState(() => checkedOf(tree, query.subtree ?? []));
  // à l'arrivée, le chemin des rubriques cochées est déplié
  const [open] = useState(() => pathTo(tree, checked));

  // appliquer : l'URL suit les cases, 300 ms après le dernier clic
  const pathname = usePagePath();
  const [loading, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const select = (next: Set<string>) => {
    setChecked(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const url = queryUrl(pathname, { ...query, subtree: [...next] });
      startTransition(() => window.history.replaceState(null, "", url));
    }, 300);
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
        {kids.length > 0 && <ChevronIcon className="chevron" />}
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
            const name = `${year} ${v.title ?? v.id}`;
            return (
              <div key={v.id} className="volume-card" data-focus={v.id === focus || undefined}>
                <Card asChild variant="classic" className="volume-thumb">
                  <button
                    type="button"
                    aria-pressed={v.id === focus}
                    aria-label={`Show the contents of ${name}`}
                    onClick={() => {
                      onFocus(v.id);
                      setPanels(2);
                    }}
                  >
                    <span className="volume-year">{year}</span>
                    <span className="volume-name">{v.title ?? v.id}</span>
                  </button>
                </Card>
                <Checkbox
                  size="3"
                  className="volume-box"
                  checked={volumeState(tree, checked, v.id)}
                  disabled={!loaded.has(v.id)}
                  onCheckedChange={() => select(toggleVolume(tree, checked, v.id))}
                  aria-label={`Select ${name}`}
                />
              </div>
            );
          })}
        </div>
      </Panel>
      <Panel id="contents" title="Contents" {...panel(1)}>
        {/* plus rien du volume au focus ; inactif quand il ne changerait rien */}
        {focus !== undefined && !loaded.has(focus) && (
          <Flex justify="center" p="4">
            <Spinner />
          </Flex>
        )}
        {focus !== undefined && loaded.has(focus) && (
          <div className="facet-actions">
            <Button
              variant="soft"
              disabled={!isVolumeSelected(tree, checked, focus)}
              onClick={() => select(setVolume(tree, checked, focus, false))}
            >
              Clear
            </Button>
          </div>
        )}
        <ul className="tree tree-root">{(tree.children.get(focus ?? "") ?? []).map(row)}</ul>
        {/* rubriques cochées des autres volumes, que Contents ne montre pas : envoyées aussi */}
        {[...checked]
          .filter((id) => tree.byId.get(id)?.volumeId !== focus)
          .map((id) => (
            <input key={id} type="hidden" form={QUERY_FORM} name="subtree" value={id} />
          ))}
      </Panel>
    </section>
  );
}, sameFacets);
