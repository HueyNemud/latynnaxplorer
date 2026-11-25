"use client";

// Formulaire de la requête (docs/SCENARIOS.md) : les boutons des zones, le champ soudé à son bouton
// Search, et les cases des facettes, rattachées par l'attribut `form` (components/Facets.tsx).
// L'envoi, comme le lien qui efface la recherche, ajoute une entrée à l'historique sans recharger
// la page, comme un envoi natif.

import { Box, Button, Flex, IconButton, TextField } from "@radix-ui/themes";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { flushSync } from "react-dom";
import { parseQuery, type Query, queryUrl, ZONES, type Zone } from "../lib/query/query.ts";
import { ClearIcon, SearchIcon } from "./icons.tsx";

/** Identifiant du formulaire de la requête, auquel les cases des facettes se rattachent. */
export const QUERY_FORM = "query";

/** Chemin de la page, sous-chemin du site compris (next.config.ts), que usePathname omet. */
export function usePagePath(): string {
  return `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${usePathname()}`;
}

/** `query` : la requête de la sélection affichée ; effacer la recherche garde ses rubriques et
 * oublie ses zones. */
export function SearchForm({ query }: { query: Query }) {
  const { text, zones, ...cleared } = query;
  const pathname = usePagePath();
  const go = (query: Query) => window.history.pushState(null, "", queryUrl(pathname, query));
  return (
    <search className="search-form">
      <Flex asChild align="center" gap="3" wrap="wrap">
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
          {/* clé : des boutons neufs à chaque requête, comme le champ */}
          <ZoneToggles key={zones?.join()} zones={zones} live={text !== undefined} />
          <Flex flexGrow="1" flexBasis="16rem" minWidth="16rem">
            <label htmlFor="search-text" className="visually-hidden">
              Search text
            </label>
            <Box flexGrow="1" minWidth="0">
              {/* clé : un champ neuf à chaque texte, même quand une navigation garde la page */}
              <TextField.Root
                key={text}
                size="3"
                className="search-input"
                id="search-text"
                type="search"
                name="text"
                defaultValue={text}
                placeholder="Search"
                autoComplete="off"
                spellCheck={false}
              >
                {text !== undefined && (
                  <TextField.Slot side="right">
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
            </Box>
            <Button type="submit" size="3" variant="surface" className="search-submit">
              <SearchIcon />
              Search
            </Button>
          </Flex>
        </form>
      </Flex>
    </search>
  );
}

/** Bouton de chaque zone : libellé, infobulle, et couleur de ses empans dans la Liste
 * (.span-* dans app/globals.css). */
const ZONE_BUTTONS = {
  subj: {
    label: "Subj",
    color: "violet",
    title: "Search in subjects: names of people and businesses",
  },
  desc: { label: "Desc", color: "teal", title: "Search in descriptions: trades, titles, details" },
  addr: { label: "Addr", color: "yellow", title: "Search in addresses" },
  other: {
    label: "Other",
    color: "gray",
    title: "Search in the rest: section headings, page headers",
  },
} as const satisfies Record<Zone, object>;

/** Boutons des zones où chercher, enfoncés pour celles de la requête (toutes sans zone) ; le
 * formulaire envoie les zones enfoncées avec le texte. `live` : un texte est cherché, un clic
 * relance aussitôt la recherche ; sinon il n'envoie rien. */
function ZoneToggles({
  zones = ZONES,
  live,
}: {
  zones: readonly Zone[] | undefined;
  live: boolean;
}) {
  const [pressed, setPressed] = useState(zones);
  return (
    <Flex gap="1" align="center" role="group" aria-label="Search in">
      {ZONES.map((z) => {
        const on = pressed.includes(z);
        return (
          <Button
            key={z}
            type="button"
            variant={on ? "soft" : "outline"}
            color={ZONE_BUTTONS[z].color}
            aria-pressed={on}
            title={ZONE_BUTTONS[z].title}
            onClick={(event) => {
              const next = on ? pressed.filter((p) => p !== z) : [...pressed, z];
              if (!live) return setPressed(next);
              // les champs cachés des zones à jour avant l'envoi
              flushSync(() => setPressed(next));
              event.currentTarget.form?.requestSubmit();
            }}
          >
            {ZONE_BUTTONS[z].label}
          </Button>
        );
      })}
      {pressed.map((z) => (
        <input key={z} type="hidden" name="in" value={z} />
      ))}
    </Flex>
  );
}
