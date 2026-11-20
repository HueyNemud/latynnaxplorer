"use client";

// Formulaire de la requête (scénarios 1 et 2 de docs/SCENARIOS.md) : le champ de recherche, et
// les cases des facettes qui s'y rattachent par l'attribut `form` (components/Facets.tsx).
// Entrée envoie le texte et les rubriques cochées ; sans rubrique cochée, la recherche porte sur
// tout l'annuaire. L'envoi, comme le lien qui efface la recherche, change l'URL de la page sans
// la recharger (nouvelle entrée de l'historique, comme un envoi natif) : la vue la suit.
// Indépendant de la vue : toute vue (Liste, plus tard Carte, Page…) peut le poser au-dessus
// d'elle.

import { IconButton, TextField } from "@radix-ui/themes";
import { usePathname } from "next/navigation";
import { parseQuery, type Query, serializeQuery } from "../lib/query/query.ts";
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
  const pathname = usePathname();
  const go = (query: Query) => {
    const params = serializeQuery(query);
    window.history.pushState(null, "", params.size > 0 ? `${pathname}?${params}` : pathname);
  };
  return (
    <search>
      <form
        id={QUERY_FORM}
        className="search-form"
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
        {/* champ de Radix Themes, loupe à gauche ; clé : un champ neuf à chaque texte, même quand
            une navigation garde la page */}
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
          {/* effacer la recherche : la même sélection sans le texte (sans rubrique : rien à
              afficher) */}
          {text !== undefined && (
            <TextField.Slot>
              <IconButton asChild size="1" variant="ghost" color="gray">
                <a
                  href={`?${serializeQuery(subtree ? { subtree } : {})}`}
                  title="Clear search"
                  onClick={(event) => {
                    event.preventDefault();
                    go(subtree ? { subtree } : {});
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
