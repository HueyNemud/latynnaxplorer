# latynnaxplorer

Exploration visuelle des annuaires commerciaux parisiens traités par la
chaîne numrev (`../adresses_revolutionnaires`). Étape actuelle : import d'un
annuaire en base, résolution des requêtes en sous-graphes (`lib/query/`) et
site Next.js : la sélection dans la vue Liste, sous un champ de recherche,
avec à gauche les facettes de structure (volumes et rubriques à cocher) ;
interface en composants et jetons de [Radix Themes](https://www.radix-ui.com/themes).

## Lancement

Prérequis : Node 26, pnpm 12, Docker, et un volume dans `data/<volume>/`
(voir [Données](#données)).

```bash
pnpm install
cp .env.example .env
pnpm db:load      # base PostgreSQL (Docker), schéma, import de data/1807
pnpm dev          # site sur http://localhost:3000
```

Sans paramètre, `/` redirige vers une entrée de 1807. La requête est dans
l'URL (`docs/SCENARIOS.md`) :

- `?subtree=<uuid>` sélectionne un nœud et tout son sous-arbre ; répété,
  l'union des sous-arbres (les rubriques cochées dans les facettes) ;
- `?text=<texte>` garde les nœuds qui contiennent le texte, sans tenir
  compte des accents ni de la casse ;
- les deux se combinent.

## Commandes

| Commande | Effet |
|---|---|
| `pnpm dev` | site en développement (Next.js) |
| `pnpm build` / `pnpm start` | site construit, puis servi |
| `pnpm db:load` | démarre la base, applique le schéma, importe `data/1807` |
| `pnpm db:push` | applique `lib/db/schema.ts` à la base (`drizzle-kit push`, sans migrations) |
| `pnpm db:import data/<volume>` | valide puis importe un volume (le remplace s'il existe) |
| `pnpm lint` / `pnpm format` | Biome : vérifier / corriger |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test` | Vitest ; base Docker démarrée (voir ci-dessous) |

La base se recrée à tout moment : `docker compose down -v && pnpm db:load`.

Les tests recréent à chaque lancement leur propre base, `<base>_test`, sur
le serveur de `DATABASE_URL` : schéma et petite fixture
(`scripts/fixture.ts`). La base de développement n'est pas touchée.

## Données

`data/` n'est pas versionné. Un volume occupe un dossier `data/<volume>/` :

- `<volume>.document.json` et `<volume>.structure.json` : livrable numrev
  (`numrev export`), copié de `annuaires/<volume>/` du projet numrev ;
- `volume.json` : métadonnées Dublin Core écrites à la main, dont
  l'intervalle `temporal` (`start`, `end` en AAAA-MM-JJ).

L'import refuse un fichier non conforme à son schéma (`scripts/schemas/`).

## Documentation

- [`docs/DESIGN.md`](docs/DESIGN.md) : concept de design (domaines, sélection et vues)
- [`docs/composants/`](docs/composants/) : fiches de composant
- [`docs/MODELE_DONNEES.md`](docs/MODELE_DONNEES.md) : sources, modèle, requêtes SQL du sous-graphe
- [`docs/SCENARIOS.md`](docs/SCENARIOS.md) : scénarios de requête et leurs filtres
- [`docs/SPRINTS.md`](docs/SPRINTS.md) : sprint en cours et suivants
- [`docs/DECISIONS.md`](docs/DECISIONS.md) : décisions structurantes
- [`docs/JOURNAL.md`](docs/JOURNAL.md) : journal de développement
- [`docs/INITIAL_PROMPT.md`](docs/INITIAL_PROMPT.md) : consigne initiale
