// Formulaire de la requête (scénarios 1 et 2 de docs/SCENARIOS.md) : le champ de recherche, et
// les cases des facettes qui s'y rattachent par l'attribut `form` (components/Facets.tsx). GET
// natif, sans script : Entrée envoie le texte et les rubriques cochées ; sans rubrique cochée,
// la recherche porte sur tout l'annuaire. Indépendant de la vue : toute vue (Liste, plus tard
// Carte, Page…) peut le poser au-dessus d'elle ; sans `action`, il renvoie à la page où il est
// posé, et le lien qui efface la recherche aussi.

import { serializeQuery } from "../lib/query/query.ts";

/** Identifiant du formulaire de la requête, auquel les cases des facettes se rattachent. */
export const QUERY_FORM = "query";

export function SearchForm({
  text,
  subtree,
}: {
  text: string | undefined;
  /** rubriques de la sélection affichée : effacer la recherche les garde */
  subtree?: readonly string[];
}) {
  return (
    <search className="search">
      <form id={QUERY_FORM} className="search-form" method="get">
        <svg className="icon search-icon" viewBox="0 0 16 16" aria-hidden="true">
          <circle cx="7" cy="7" r="4.5" />
          <path d="m10.5 10.5 3 3" />
        </svg>
        <label htmlFor="search-text" className="visually-hidden">
          Search text
        </label>
        {/* clé : un champ neuf à chaque texte, même quand une navigation garde la page */}
        <input
          key={text}
          id="search-text"
          className="search-input"
          type="search"
          name="text"
          defaultValue={text}
          placeholder="Search"
          autoComplete="off"
          spellCheck={false}
        />
        {/* effacer la recherche : la même sélection sans le texte (sans rien : la sélection par
            défaut) */}
        {text !== undefined && (
          <a
            className="search-clear"
            href={`?${serializeQuery(subtree ? { subtree } : {})}`}
            title="Clear search"
          >
            <svg className="icon" viewBox="0 0 16 16" aria-hidden="true">
              <path d="m4.5 4.5 7 7m0-7-7 7" />
            </svg>
            <span className="visually-hidden">Clear search</span>
          </a>
        )}
      </form>
    </search>
  );
}
