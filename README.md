# latynnaxplorer

Exploration visuelle des annuaires commerciaux parisiens traités par la
chaîne numrev (`../adresses_revolutionnaires`). Un site statique : chaque
annuaire est un fichier, téléchargé quand on en a besoin, et interrogé dans
le navigateur (`lib/query/`). La sélection s'affiche dans la vue Liste, sous
un champ de recherche, avec à gauche les facettes de structure (volumes et
rubriques à cocher) ; interface en composants et jetons de
[Radix Themes](https://www.radix-ui.com/themes).

## Lancement

Prérequis : Node 26, pnpm 12, et un volume dans `data/<volume>/` (voir
[Données](#données)).

```bash
pnpm install
pnpm volume:export data/1807   # public/volumes/<volume>.json et index.json
pnpm dev                       # site sur http://localhost:3000
```

La requête est dans l'URL (`docs/SCENARIOS.md`) :

- `?subtree=<uuid>` sélectionne un nœud et tout son sous-arbre ; répété,
  l'union des sous-arbres (les rubriques cochées dans les facettes) ;
- `?text=<texte>` garde les nœuds qui contiennent le texte, sans tenir
  compte des accents ni de la casse ;
- les deux se combinent ; sans critère, rien n'est sélectionné.

## Commandes

| Commande | Effet |
|---|---|
| `pnpm dev` | site en développement (Next.js) |
| `pnpm build` | site statique dans `out/` |
| `pnpm volume:export data/<volume> [dossier]` | valide un volume et l'exporte, l'ajoute à l'index (`public/volumes` par défaut) |
| `pnpm lint` / `pnpm format` | Biome : vérifier / corriger |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test` | Vitest, sur une petite fixture (`scripts/fixture.ts`) |

## Données

`data/` n'est pas versionné. Un volume occupe un dossier `data/<volume>/` :

- `<volume>.document.json` et `<volume>.structure.json` : livrable numrev
  (`numrev export`), copié de `annuaires/<volume>/` du projet numrev ;
- `volume.json` : métadonnées Dublin Core écrites à la main, dont
  l'intervalle `temporal` (`start`, `end` en AAAA-MM-JJ).

L'export refuse un fichier non conforme à son schéma (`scripts/schemas/`).
Format des fichiers exportés : `docs/MODELE_DONNEES.md`.

## Mise en ligne

`out/` se sert tel quel par n'importe quel hébergement statique. Les
volumes peuvent l'accompagner (`public/volumes/`, copié dans `out/`) ou être
hébergés à part : l'adresse de l'index se fixe au build,

```bash
NEXT_PUBLIC_VOLUMES_INDEX=https://exemple.org/annuaires/index.json pnpm build
```

L'index et les volumes doivent alors être servis avec l'en-tête CORS
(`Access-Control-Allow-Origin`), et de préférence compressés (gzip : 1,3 Mo
au lieu de 7,2 pour 1807).

## Documentation

- [`docs/DESIGN.md`](docs/DESIGN.md) : concept de design (domaines, sélection et vues)
- [`docs/composants/`](docs/composants/) : fiches de composant
- [`docs/MODELE_DONNEES.md`](docs/MODELE_DONNEES.md) : sources, modèle, fichiers, requête
- [`docs/SCENARIOS.md`](docs/SCENARIOS.md) : scénarios de requête et leurs filtres
- [`docs/SPRINTS.md`](docs/SPRINTS.md) : sprint en cours et suivants
- [`docs/DECISIONS.md`](docs/DECISIONS.md) : décisions structurantes
- [`docs/JOURNAL.md`](docs/JOURNAL.md) : journal de développement
- [`docs/INITIAL_PROMPT.md`](docs/INITIAL_PROMPT.md) : consigne initiale
