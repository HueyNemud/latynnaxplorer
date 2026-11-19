// Champ de recherche (scénario 2 de docs/SCENARIOS.md) : réécrit le critère `text` de la
// requête et garde tous les autres, par un formulaire GET natif, sans script. Indépendant de la
// vue : toute vue (Liste, plus tard Carte, Page…) peut le poser au-dessus d'elle ; sans
// `action`, le formulaire renvoie à la page où il est posé.

import { type Query, serializeQuery } from "../lib/query/query.ts";

export function SearchForm({ query }: { query: Query }) {
  const { text, ...others } = query;
  return (
    <search className="search">
      <form method="get">
        {[...serializeQuery(others)].map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
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
      </form>
    </search>
  );
}
