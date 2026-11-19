// Champ de recherche (scénario 2 de docs/SCENARIOS.md) : commence une nouvelle sélection, les
// nœuds de tout l'annuaire qui contiennent le texte, par un formulaire GET natif, sans script.
// Indépendant de la vue : toute vue (Liste, plus tard Carte, Page…) peut le poser au-dessus
// d'elle ; sans `action`, le formulaire renvoie à la page où il est posé.

export function SearchForm({ text }: { text: string | undefined }) {
  return (
    <search className="search">
      <form method="get">
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
