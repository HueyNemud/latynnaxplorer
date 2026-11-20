// Formulaire de la requête (scénarios 1 et 2 de docs/SCENARIOS.md) : le champ de recherche, et
// les cases des facettes qui s'y rattachent par l'attribut `form` (components/Facets.tsx). GET
// natif, sans script : Entrée envoie le texte et les rubriques cochées ; sans rubrique cochée,
// la recherche porte sur tout l'annuaire. Indépendant de la vue : toute vue (Liste, plus tard
// Carte, Page…) peut le poser au-dessus d'elle ; sans `action`, il renvoie à la page où il est
// posé, et le lien qui efface la recherche aussi.

import { serializeQuery } from "../lib/query/query.ts";
import { ClearIcon, SearchIcon } from "./icons.tsx";

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
        <SearchIcon className="search-icon" />
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
        {/* effacer la recherche : la même sélection sans le texte (sans rubrique : rien à
            afficher) */}
        {text !== undefined && (
          <a
            className="icon-button search-clear"
            href={`?${serializeQuery(subtree ? { subtree } : {})}`}
            title="Clear search"
          >
            <ClearIcon />
            <span className="visually-hidden">Clear search</span>
          </a>
        )}
      </form>
    </search>
  );
}
