"use client";

// Facettes de structure (docs/composants/facettes.md) : panneaux Volumes et Contents, à gauche
// de la vue, en colonnes de Miller.
// - Sélection et focus distincts (docs/DESIGN.md) : la coche ronde d'un volume le sélectionne
//   ou le désélectionne tout entier ; un clic sur sa vignette met le focus sur lui, et Contents
//   montre son arbre. Un volume est sélectionné si une rubrique au moins l'est.
// - Cocher une rubrique prend tout son sous-arbre : les cases de ses descendants sont couvertes
//   (cochées, en pâle) ; la décocher les libère, décochées. Cliquer une case couverte ne garde
//   qu'elle : la rubrique qui la couvre est décochée. Une rubrique ou un volume dont une partie
//   seulement est cochée est semi-sélectionné (tiret) ; un clic le coche entier. Règles des
//   coches : lib/facets/selection.ts.
// - Volumes chargés à la demande (components/Explorer.tsx) : le volume regardé est l'état de la
//   page, qui le charge ; Contents attend le sien. La coche ronde d'un volume pas encore chargé
//   est inactive (ses rubriques ne sont pas connues).
// - Les cases font partie du formulaire de la requête (#query, components/SearchForm.tsx) par
//   l'attribut `form`. Une case couverte, sans nom, n'est pas envoyée : seules partent les
//   rubriques cochées les plus hautes. Cases, coches et boutons de Radix Themes : une case Radix
//   est un bouton, avec une case cachée pour le formulaire ; sans script, les facettes ne
//   servent pas.
// - Filtrer à la coche : chaque coche s'applique aussitôt. Les coches sont l'état de ce
//   composant, lu une fois depuis l'URL ; l'URL les suit (l'entrée de l'historique est
//   remplacée, sans requête au serveur), après un court délai qui regroupe les coches
//   rapprochées. La vue est estompée pendant son calcul. Le volume regardé et l'arbre déplié
//   restent.
// - Contents est local au volume regardé (facettes hiérarchiques) : All coche tout ce volume,
//   Clear le décoche ; les autres volumes ne changent pas.

import { Button, Card, Checkbox, Flex, Spinner } from "@radix-ui/themes";
import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  checkedOf,
  coveredBy,
  isVolumeFull,
  isVolumeSelected,
  keepOnly,
  pathTo,
  sectionTree,
  setVolume,
  toggleSection,
  toggleVolume,
  volumeState,
} from "../lib/facets/selection.ts";
import { serializeQuery } from "../lib/query/query.ts";
import type { FacetSection, Volume } from "../lib/query/types.ts";
import { plainText } from "../lib/text/segments.ts";
import { ChevronIcon } from "./icons.tsx";
import { Panel } from "./Panel.tsx";
import { QUERY_FORM } from "./SearchForm.tsx";

export function Facets({
  volumes,
  sections,
  checked: subtree,
  text,
  focus,
  onFocus,
  loaded,
}: {
  /** tous les volumes de l'index */
  volumes: Volume[];
  /** les rubriques des volumes chargés */
  sections: FacetSection[];
  /** les `subtree` de l'URL : rubriques cochées les plus hautes */
  checked: readonly string[];
  /** le texte cherché de la sélection affichée, gardé quand les coches changent */
  text: string | undefined;
  /** le volume regardé, dont Contents montre l'arbre */
  focus: string | undefined;
  onFocus: (volumeId: string) => void;
  /** les volumes chargés */
  loaded: ReadonlySet<string>;
}) {
  const tree = useMemo(() => sectionTree(sections), [sections]);
  // les coches, lues une fois depuis l'URL
  const [checked, setChecked] = useState(() => checkedOf(tree, subtree));
  // à l'arrivée, le chemin des rubriques cochées est déplié
  const [open] = useState(() => pathTo(tree, checked));

  // appliquer : l'URL suit les coches, après 300 ms sans nouvelle coche
  const pathname = usePathname();
  const [loading, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const select = (next: Set<string>) => {
    setChecked(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const query = serializeQuery({
        ...(next.size > 0 && { subtree: [...next] }),
        ...(text !== undefined && { text }),
      });
      const url = query.size > 0 ? `${pathname}?${query}` : pathname;
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

  // rubriques semi-sélectionnées : une rubrique en dessous d'elles est cochée
  const partial = useMemo(() => pathTo(tree, checked), [tree, checked]);

  const row = (s: FacetSection): ReactNode => {
    const kids = tree.children.get(s.id) ?? [];
    // la rubrique cochée qui couvre celle-ci, s'il y en a une
    const cover = tree.byId.get(coveredBy(tree, checked, s.id) ?? "");
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
                {/* la vignette met le focus sur le volume : son arbre dans Contents */}
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
                {/* la coche ronde, sur la vignette : sélectionne ou désélectionne tout le volume */}
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
        {/* tout le volume regardé, ou rien de lui ; inactifs quand ils ne changeraient rien */}
        {focus !== undefined && !loaded.has(focus) && (
          <Flex justify="center" p="4">
            <Spinner />
          </Flex>
        )}
        {focus !== undefined && loaded.has(focus) && (
          <div className="facet-actions">
            <Button
              variant="soft"
              disabled={isVolumeFull(tree, checked, focus)}
              onClick={() => select(setVolume(tree, checked, focus, true))}
            >
              All
            </Button>
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
}
