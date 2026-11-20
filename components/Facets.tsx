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
// - Seules les facettes changent la sélection, et toujours en rechargeant la page (formulaires
//   GET natifs) : l'état ci-dessous est lu une fois, depuis l'URL.

import { Button, Card, Checkbox } from "@radix-ui/themes";
import { type ReactNode, useMemo, useState } from "react";
import {
  checkedOf,
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
  text,
}: {
  volumes: FacetVolume[];
  sections: FacetSection[];
  /** les `subtree` de l'URL : rubriques cochées les plus hautes */
  checked: readonly string[];
  /** le texte cherché de la sélection affichée, que Clear garde */
  text: string | undefined;
}) {
  const tree = useMemo(() => sectionTree(sections), [sections]);
  // les coches de la sélection affichée
  const initial = useMemo(() => checkedOf(tree, subtree), [tree, subtree]);
  const [checked, setChecked] = useState(initial);
  // focus : le volume de la première rubrique cochée, sinon le premier volume
  const [focus, setFocus] = useState(
    () => tree.byId.get([...initial][0] ?? "")?.volumeId ?? volumes[0]?.id,
  );
  // à l'arrivée, le chemin des rubriques cochées est déplié
  const [open] = useState(() => pathTo(tree, initial));
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
    <section className="facets" aria-label="Selection">
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
                      setFocus(v.id);
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
