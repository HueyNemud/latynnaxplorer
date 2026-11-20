"use client";

// Facettes de structure (docs/composants/facettes.md) : panneaux Volumes et Contents, à gauche
// de la vue, en colonnes de Miller.
// - Sélection et focus distincts (docs/DESIGN.md) : la coche ronde d'un volume le sélectionne
//   ou le désélectionne tout entier ; un clic sur sa vignette met le focus sur lui, et Contents
//   montre son arbre. Un volume est sélectionné si une rubrique au moins l'est.
// - Cocher une rubrique prend tout son sous-arbre : les cases de ses descendants sont couvertes
//   (cochées, désactivées) ; la décocher les réactive, décochées. Règles des coches :
//   lib/facets/selection.ts.
// - Les cases font partie du formulaire de la requête (#query, components/SearchForm.tsx) par
//   l'attribut `form`. Une case couverte, désactivée, n'est pas envoyée : seules partent les
//   rubriques cochées les plus hautes. Cases, coches et boutons de Radix Themes : une case Radix
//   est un bouton, avec une case cachée pour le formulaire ; sans script, les facettes ne
//   servent pas.
// - En haut de Contents, toujours là : Apply envoie le formulaire (inactif sans changement) ;
//   Clear applique aussitôt une sélection sans coche, en gardant le texte cherché (inactif sans
//   coche), par son propre formulaire GET.
// - Toujours conformes à l'URL : à chaque nouvelle sélection (lien de la Liste, fil d'Ariane,
//   bouton Précédent), les cases reprennent les coches de l'URL ; le volume regardé et les
//   rubriques dépliées restent, le chemin de la sélection est déplié en plus.

import { Button, Checkbox } from "@radix-ui/themes";
import { type ReactNode, useMemo, useState } from "react";
import {
  checkedOf,
  focusFor,
  isCovered,
  isVolumeSelected,
  pathTo,
  sameChecks,
  sectionTree,
  toggleSection,
  toggleVolume,
} from "../lib/facets/selection.ts";
import type { FacetSection, FacetVolume } from "../lib/query/types.ts";
import { plainText } from "../lib/text/segments.ts";
import { ChevronIcon } from "./icons.tsx";
import { Panel } from "./Panel.tsx";
import { QUERY_FORM } from "./SearchForm.tsx";

export function Facets({
  volumes,
  sections,
  checked: subtree,
  places,
  text,
}: {
  volumes: FacetVolume[];
  sections: FacetSection[];
  /** les `subtree` de l'URL : rubriques cochées les plus hautes */
  checked: readonly string[];
  /** rubriques qui contiennent les nœuds désignés : un nœud qui n'est pas une rubrique ne se
   * coche pas, mais les facettes le situent */
  places: readonly string[];
  /** le texte cherché de la sélection affichée, que Clear garde */
  text: string | undefined;
}) {
  const tree = useMemo(() => sectionTree(sections), [sections]);
  // les coches de la sélection affichée
  const initial = useMemo(() => checkedOf(tree, subtree), [tree, subtree]);
  const [checked, setChecked] = useState(initial);
  // focus : le volume de la sélection (première coche, sinon première rubrique qui contient un
  // nœud désigné), sinon le premier volume
  const [focus, setFocus] = useState(() => focusFor(tree, [...initial, ...places], volumes[0]?.id));
  // rubriques dépliées : le chemin de la sélection, puis ce que l'on déplie ou replie
  const [open, setOpen] = useState(() => pathTo(tree, initial, places));
  // Nouvelle sélection : la navigation de Next garde ce composant, l'état ci-dessus n'a été lu
  // qu'au premier rendu. Les props changent à chaque navigation : l'état suit, pendant le rendu.
  const [shown, setShown] = useState(subtree);
  if (shown !== subtree) {
    setShown(subtree);
    setChecked(initial);
    setFocus(focusFor(tree, [...initial, ...places], focus));
    setOpen(new Set([...open, ...pathTo(tree, initial, places)]));
  }
  // panneaux ouverts : toujours les premiers (Volumes, puis Contents) ; ouvrir un panneau ouvre
  // ceux des niveaux au-dessus, en replier un replie ceux des niveaux en dessous
  const [panels, setPanels] = useState(2);
  const panel = (level: number) => ({
    open: level < panels,
    onToggle: () => setPanels(level < panels ? level : level + 1),
  });

  const row = (s: FacetSection): ReactNode => {
    const kids = tree.children.get(s.id) ?? [];
    const covered = isCovered(tree, checked, s.id);
    const label = plainText(s.text);
    const line = (
      <>
        {kids.length > 0 && <ChevronIcon className="chevron" />}
        <Checkbox
          size="1"
          className="tree-box"
          form={QUERY_FORM}
          name="subtree"
          value={s.id}
          checked={covered || checked.has(s.id)}
          disabled={covered}
          onCheckedChange={() => setChecked(toggleSection(tree, checked, s.id))}
          aria-label={label}
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
          <details
            open={open.has(s.id)}
            onToggle={(e) => {
              // dépliée ou repliée à la main : retenue pour la sélection suivante
              const isOpen = e.currentTarget.open;
              setOpen((o) => {
                if (isOpen === o.has(s.id)) return o;
                const next = new Set(o);
                if (isOpen) next.add(s.id);
                else next.delete(s.id);
                return next;
              });
            }}
          >
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
    <section className="facets" aria-label="Selection">
      <Panel id="volumes" title="Volumes" {...panel(0)}>
        <div className="volume-cards">
          {volumes.map((v) => {
            const year = v.temporalStart.slice(0, 4);
            const name = `${year} ${v.title ?? v.id}`;
            return (
              <div key={v.id} className="volume-card" data-focus={v.id === focus || undefined}>
                {/* la vignette met le focus sur le volume : son arbre dans Contents */}
                <button
                  type="button"
                  className="volume-thumb"
                  aria-pressed={v.id === focus}
                  aria-label={`Show the contents of ${name}`}
                  onClick={() => {
                    setFocus(v.id);
                    setPanels(2);
                  }}
                >
                  <span className="volume-year">{year}</span>
                  <span className="volume-name">{v.title ?? v.id}</span>
                </button>
                {/* la coche ronde, sur la vignette : sélectionne ou désélectionne tout le volume */}
                <Checkbox
                  size="3"
                  className="volume-box"
                  checked={isVolumeSelected(tree, checked, v.id)}
                  onCheckedChange={() => setChecked(toggleVolume(tree, checked, v.id))}
                  aria-label={`Select ${name}`}
                />
              </div>
            );
          })}
        </div>
      </Panel>
      <Panel id="contents" title="Contents" {...panel(1)}>
        <div className="facet-actions">
          <Button type="submit" form={QUERY_FORM} disabled={sameChecks(checked, initial)}>
            Apply selection
          </Button>
          <form method="get">
            {text !== undefined && <input type="hidden" name="text" value={text} />}
            <Button type="submit" variant="soft" disabled={checked.size === 0}>
              Clear
            </Button>
          </form>
        </div>
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
