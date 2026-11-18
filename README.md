# latynnaxplorer

Exploration visuelle des annuaires commerciaux parisiens traités par la
chaîne numrev (`../adresses_revolutionnaires`). Étape actuelle : modèle de
données et import d'un annuaire en base ; pas encore de site web.

## Lancement

Prérequis : Node 26, pnpm 12, Docker, et un volume dans `data/<volume>/`
(voir [Données](#données)).

```bash
pnpm install
cp .env.example .env
pnpm db:load      # base PostgreSQL (Docker), schéma, import de data/1807
```

## Commandes

| Commande | Effet |
|---|---|
| `pnpm db:load` | démarre la base, applique le schéma, importe `data/1807` |
| `pnpm db:push` | applique `lib/db/schema.ts` à la base (`drizzle-kit push`, sans migrations) |
| `pnpm db:import data/<volume>` | valide puis importe un volume (le remplace s'il existe) |
| `pnpm lint` / `pnpm format` | Biome : vérifier / corriger |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test` | Vitest |

La base se recrée à tout moment : `docker compose down -v && pnpm db:load`.

## Données

`data/` n'est pas versionné. Un volume occupe un dossier `data/<volume>/` :

- `<volume>.document.json` et `<volume>.structure.json` : livrable numrev
  (`numrev export`), copié de `annuaires/<volume>/` du projet numrev ;
- `volume.json` : métadonnées Dublin Core écrites à la main, dont
  l'intervalle `temporal` (`start`, `end` en AAAA-MM-JJ).

L'import refuse un fichier non conforme à son schéma (`scripts/schemas/`).

## Documentation

- [`docs/MODELE_DONNEES.md`](docs/MODELE_DONNEES.md) : sources, modèle, requêtes SQL du sous-graphe
- [`docs/DECISIONS.md`](docs/DECISIONS.md) : décisions structurantes
- [`docs/JOURNAL.md`](docs/JOURNAL.md) : journal de développement
- [`docs/INITIAL_PROMPT.md`](docs/INITIAL_PROMPT.md) : consigne initiale
