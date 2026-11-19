// Champ de recherche (scénario 2 de docs/SCENARIOS.md) : commence une nouvelle sélection, les
// nœuds de tout l'annuaire qui contiennent le texte, par un formulaire GET natif, sans script.
// Indépendant de la vue : toute vue (Liste, plus tard Carte, Page…) peut le poser au-dessus
// d'elle ; sans `action`, le formulaire renvoie à la page où il est posé, et le lien qui efface
// la recherche aussi.

export function SearchForm({ text }: { text: string | undefined }) {
  return (
    <search className="search">
      <form className="search-form" method="get">
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
        {/* effacer la recherche : la même page sans critère, donc la sélection par défaut */}
        {text !== undefined && (
          <a className="search-clear" href="?" title="Clear search">
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
