"use client";

// Formulaire de la requête (docs/SCENARIOS.md) : le champ de recherche, et les cases des
// facettes qui s'y rattachent par l'attribut `form` (components/Facets.tsx). Entrée envoie le
// texte et les rubriques cochées ; sans rubrique cochée, la recherche porte sur tout l'annuaire.
// L'envoi, comme le lien qui efface la recherche, ajoute une entrée à l'historique sans recharger
// la page, comme un envoi natif.

import { IconButton, TextField } from "@radix-ui/themes";
import { usePathname } from "next/navigation";
import { parseQuery, type Query, queryUrl } from "../lib/query/query.ts";
import { ClearIcon, SearchIcon } from "./icons.tsx";

/** Identifiant du formulaire de la requête, auquel les cases des facettes se rattachent. */
export const QUERY_FORM = "query";

/** `query` : la requête de la sélection affichée ; effacer la recherche garde ses rubriques. */
export function SearchForm({ query }: { query: Query }) {
  const { text, ...cleared } = query;
  const pathname = usePathname();
  const go = (query: Query) => window.history.pushState(null, "", queryUrl(pathname, query));
  return (
    <search className="search-form">
      <form
        id={QUERY_FORM}
        method="get"
        onSubmit={(event) => {
          event.preventDefault();
          const params = new URLSearchParams();
          for (const [name, value] of new FormData(event.currentTarget))
            if (typeof value === "string") params.append(name, value);
          go(parseQuery(params));
        }}
      >
        <label htmlFor="search-text" className="visually-hidden">
          Search text
        </label>
        {/* clé : un champ neuf à chaque texte, même quand une navigation garde la page */}
        <TextField.Root
          key={text}
          id="search-text"
          type="search"
          name="text"
          defaultValue={text}
          placeholder="Search"
          autoComplete="off"
          spellCheck={false}
        >
          <TextField.Slot>
            <SearchIcon />
          </TextField.Slot>
          {text !== undefined && (
            <TextField.Slot>
              <IconButton asChild size="1" variant="ghost" color="gray">
                <a
                  href={queryUrl(pathname, cleared)}
                  title="Clear search"
                  onClick={(event) => {
                    event.preventDefault();
                    go(cleared);
                  }}
                >
                  <ClearIcon />
                  <span className="visually-hidden">Clear search</span>
                </a>
              </IconButton>
            </TextField.Slot>
          )}
        </TextField.Root>
      </form>
    </search>
  );
}
