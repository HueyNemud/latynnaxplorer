"use client";

// Facettes de structure (docs/composants/facettes.md) : panneaux Volumes et Contents, à gauche
// de la vue, en colonnes de Miller.
// - Sélection et focus distincts (docs/DESIGN.md) : la coche ronde d'un volume le sélectionne
//   ou le désélectionne tout entier ; un clic sur sa vignette met le focus sur lui, et Contents
//   montre son arbre. Un volume est sélectionné si une rubrique au moins l'est.
// - Cocher une rubrique prend tout son sous-arbre : les cases de ses descendants sont couvertes
//   (cochées, désactivées) ; la décocher les réactive, décochées.
// - Les cases font partie du formulaire de la requête (#query, components/SearchForm.tsx) par
//   l'attribut `form`. Une case couverte, désactivée, n'est pas envoyée : seules partent les
//   rubriques cochées les plus hautes. Le script ne sert qu'à propager les coches.

import { type ReactNode, useMemo, useState } from "react";
import type { FacetSection, FacetVolume } from "../lib/query/types.ts";
import { plainText } from "../lib/text/segments.ts";
import { QUERY_FORM } from "./SearchForm.tsx";

export function Facets({
  volumes,
  sections,
  checked: initialChecked,
}: {
  volumes: FacetVolume[];
  sections: FacetSection[];
  /** les `subtree` de l'URL : rubriques cochées les plus hautes */
  checked: readonly string[];
}) {
  // parent de chaque rubrique ; enfants de chaque rubrique, et rubriques de premier niveau de
  // chaque volume (clé : l'identifiant du volume)
  const { byId, parent, children } = useMemo(() => {
    const byId = new Map<string, FacetSection>();
    const parent = new Map<string, string>();
    const children = new Map<string, FacetSection[]>();
    for (const s of sections) {
      byId.set(s.id, s);
      if (s.parentId) parent.set(s.id, s.parentId);
      const key = s.parentId ?? s.volumeId;
      const list = children.get(key);
      if (list) list.push(s);
      else children.set(key, [s]);
    }
    return { byId, parent, children };
  }, [sections]);

  // seules les rubriques sont des cases : un `subtree` d'un autre nœud (une entrée ouverte seule)
  // ne coche rien
  const initial = useMemo(
    () => new Set(initialChecked.filter((id) => byId.has(id))),
    [initialChecked, byId],
  );
  const [checked, setChecked] = useState(initial);
  // focus : le volume de la première rubrique cochée, sinon le premier volume
  const [focus, setFocus] = useState(
    () => byId.get([...initial][0] ?? "")?.volumeId ?? volumes[0]?.id,
  );
  // à l'arrivée, le chemin des rubriques cochées est déplié
  const [open] = useState(() => {
    const path = new Set<string>();
    for (const id of initial)
      for (let p = parent.get(id); p !== undefined; p = parent.get(p)) path.add(p);
    return path;
  });
  // panneaux ouverts : toujours les premiers (Volumes, puis Contents) ; ouvrir un panneau ouvre
  // ceux des niveaux au-dessus, en replier un replie ceux des niveaux en dessous
  const [panels, setPanels] = useState(2);
  const panel = (level: number) => ({
    open: level < panels,
    onToggle: () => setPanels(level < panels ? level : level + 1),
  });

  // des changements à appliquer : les cases ne sont plus celles de la sélection affichée
  const dirty = checked.size !== initial.size || [...checked].some((id) => !initial.has(id));

  const covered = (id: string): boolean => {
    for (let p = parent.get(id); p !== undefined; p = parent.get(p))
      if (checked.has(p)) return true;
    return false;
  };

  const toggle = (id: string) => {
    const next = new Set(checked);
    if (next.has(id)) next.delete(id);
    else {
      next.add(id);
      // les descendants sont désormais couverts : on ne garde que la rubrique la plus haute
      const stack = [...(children.get(id) ?? [])];
      for (let s = stack.pop(); s; s = stack.pop()) {
        next.delete(s.id);
        stack.push(...(children.get(s.id) ?? []));
      }
    }
    setChecked(next);
  };

  const volumeSelected = (id: string) =>
    sections.some((s) => s.volumeId === id && checked.has(s.id));

  // tout le volume : ses rubriques de premier niveau ; ou plus rien
  const toggleVolume = (id: string) => {
    const selected = volumeSelected(id);
    const next = new Set([...checked].filter((c) => byId.get(c)?.volumeId !== id));
    if (!selected) for (const t of children.get(id) ?? []) next.add(t.id);
    setChecked(next);
  };

  const row = (s: FacetSection): ReactNode => {
    const kids = children.get(s.id) ?? [];
    const isCovered = covered(s.id);
    const label = plainText(s.text);
    const line = (
      <>
        {kids.length > 0 && (
          <svg className="icon tree-chevron" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M6 3.5 10.5 8 6 12.5" />
          </svg>
        )}
        <input
          type="checkbox"
          className="tree-box"
          form={QUERY_FORM}
          name="subtree"
          value={s.id}
          checked={isCovered || checked.has(s.id)}
          disabled={isCovered}
          onChange={() => toggle(s.id)}
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
            <summary className="tree-line" aria-labelledby={`tree-${s.id}`}>
              {line}
            </summary>
            <ul className="tree">{kids.map(row)}</ul>
          </details>
        ) : (
          <div className="tree-line">{line}</div>
        )}
      </li>
    );
  };

  return (
    <section className="facets" aria-label="Selection">
      <Panel id="volumes" title="Volumes" {...panel(0)}>
        <div className="volume-cards">
          {volumes.map((v) => {
            const name = `${v.temporalStart.slice(0, 4)} ${v.title ?? v.id}`;
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
                  <span className="volume-year">{v.temporalStart.slice(0, 4)}</span>
                  <span className="volume-name">{v.title ?? v.id}</span>
                </button>
                {/* la coche ronde, sur la vignette : sélectionne ou désélectionne tout le volume */}
                <input
                  type="checkbox"
                  className="volume-box"
                  checked={volumeSelected(v.id)}
                  onChange={() => toggleVolume(v.id)}
                  aria-label={`Select ${name}`}
                />
              </div>
            );
          })}
        </div>
      </Panel>
      <Panel id="contents" title="Contents" {...panel(1)}>
        <ul className="tree tree-root">{(children.get(focus ?? "") ?? []).map(row)}</ul>
        {/* rubriques cochées des autres volumes, que Contents ne montre pas : envoyées aussi */}
        {[...checked]
          .filter((id) => byId.get(id)?.volumeId !== focus)
          .map((id) => (
            <input key={id} type="hidden" form={QUERY_FORM} name="subtree" value={id} />
          ))}
        <div className="apply" hidden={!dirty}>
          <button type="submit" form={QUERY_FORM} className="apply-button">
            Apply selection
          </button>
        </div>
      </Panel>
    </section>
  );
}

/** Panneau repliable : son contenu, et à sa droite une bande qui le replie ou le déplie. */
function Panel({
  id,
  title,
  open,
  onToggle,
  children,
}: {
  id: string;
  title: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <section className="panel" aria-label={title}>
      <div id={`panel-${id}`} className={`panel-body panel-${id}`} hidden={!open}>
        {children}
      </div>
      <button
        type="button"
        className="panel-strip"
        aria-expanded={open}
        aria-controls={`panel-${id}`}
        title={open ? `Collapse ${title}` : `Expand ${title}`}
        onClick={onToggle}
      >
        <svg className="icon" viewBox="0 0 16 16" aria-hidden="true">
          <path d={open ? "M10 3.5 5.5 8 10 12.5" : "M6 3.5 10.5 8 6 12.5"} />
        </svg>
        <span className="panel-strip-title">{title}</span>
      </button>
    </section>
  );
}
