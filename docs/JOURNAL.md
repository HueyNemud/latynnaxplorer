# Journal de développement

## 2026-10-30 — Processus : dépôt GitHub, branches et PR

**Fait**
- Dépôt privé `hueynemud/latynnaxplorer` créé ; `main` réduit au projet
  initial (brief, outillage, base Docker), le travail du modèle de données
  déplacé sur `feat/modele-donnees`, proposé en PR.
- `CLAUDE.md` : façon de travailler (un sprint = une branche, PR fusionnée
  par l'utilisateur, étapes validées une à une).
- `docs/SPRINTS.md` : les trois prochains sprints (CI, `lib/query/`, vue
  Liste).

**Décisions**
- `main` ne reçoit que des PR relues et fusionnées par l'utilisateur.
- Dépôt privé.

**Questions ouvertes**
- Protection de `main` sur un dépôt privé : compte GitHub Pro nécessaire ?

**Suite**
- Relecture et fusion de la PR du modèle de données, puis sprint 1 (CI).

## 2026-10-30 — Échafaudage données : schéma, validation, import

**Fait**
- Dépôt Git initialisé ; outillage Node 26 / pnpm 12, TypeScript 6, Biome,
  Vitest, Lefthook (biome check + tsc au pre-commit, commitlint) —
  `4f137c4`, `c3b42c3`.
- Base PostgreSQL 17 + PostGIS via Docker Compose, extensions `pg_trgm`,
  `unaccent`, fonction `immutable_unaccent` — `659e440`, `aa751a7`.
- Schéma Drizzle du modèle v2 (`lib/db/schema.ts`) — `9c98dac`.
- Validation des fichiers d'un volume (ajv, schémas numrev) — `d637718`.
- Import (`scripts/import.ts`), scripts `db:import` / `db:load` —
  `96507b4`. 1807 : 21 312 nœuds, 45 673 empans, 21 260 ancres, en ≈ 5 s.
- 13 tests Vitest sur une petite fixture conforme ; README.

**Décisions**
- PostgreSQL 17 : drizzle-kit 0.31 n'est pas idempotent avec 18 (vérifié).
- Noms de colonnes SQL explicites, sans l'option `casing` de Drizzle.
- Boîtes en `real` : fidèles au type `number` du schéma numrev.
- Pas de `lib/db/client.ts` : seul le script d'import se connecte.
- Scripts de build de `esbuild` et `lefthook` refusés (`pnpm-workspace.yaml`) :
  inutiles ici.
- Schémas numrev exclus de Biome pour rester identiques à l'original.

**Questions ouvertes**
- Titre et autres champs Dublin Core de `data/1807/volume.json` à remplir.

**Suite**
- Proposer l'étape suivante : `lib/query/` (requête ⇄ URL, résolution en
  sous-graphe) ou l'application Next.js, selon votre priorité.

## 2026-10-30 — Modèle v2 : une table de nœuds

**Fait**
- `docs/MODELE_DONNEES.md` réécrit (v2) : 4 tables `volume`, `node`,
  `span`, `anchor` ; arcs `member_of` / `child_of` / `follows` déduits des
  colonnes.
- `data/1807/volume.json` prérempli (Dublin Core + `temporal`).

**Décisions**
- numrev fait foi, pas de rattrapage : plus de repli sur la boîte du bloc,
  un nœud sans ligne boîtée n'a pas d'ancre.
- Sections et entrées dans une seule table `node`, ancrées par la même
  table `anchor`.
- Retirés car inutilisés : table `page`, `level`, `kind` d'entrée, membres,
  indicateurs de qualité, provenance, table `link`.

- Géocodage : aucune table, sprint dédié (noté dans `MODELE_DONNEES.md`).
- Les deux JSON de 1807 déplacés dans `data/1807/` (accord donné).

**Questions ouvertes**
- Validation explicite du modèle v2.
- Arborescence et dépendances proposées, en attente de validation.

**Suite**
- Après validation : échafaudage en petits commits atomiques.

## 2026-10-30 — Sections comme nœuds, premières décisions

**Fait**
- Discussion du modèle : sections promues au rang de nœuds typés.
- Décisions reportées dans `docs/DECISIONS.md`. `docs/MODELE_DONNEES.md`
  sera réécrit une fois les points ci-dessous tranchés.

**Décisions**
- Nœuds typés `entry` / `section` ; arcs `member_of`, `child_of`, `follows`
  portés par des colonnes ; sous-graphe induit strict.
- `follows` entre entrées, dans l'ordre de lecture, à travers les sections.
- Un seul annuaire pour l'instant, pas de liens temporels ; IIIF plus tard.
- `data/` hors Git ; extension `unaccent`.

**Questions ouvertes**
- Groupe à accolade : un nœud ou un nœud par membre ?
- Ancrage des sections : page + boîte sur la table `section` ?
- Table `link` : retirée du modèle ou gardée vide ?
- Emplacement des données (`data/` ou `data/1807/`) et versionnement du
  fichier de métadonnées du volume.

**Suite**
- Réécrire `docs/MODELE_DONNEES.md`, puis proposer arborescence et
  dépendances.

**Pour plus tard : liens temporels**
- Arcs entre entrées d'éditions successives, importés de la jointure numrev
  `<A>__<B>.<méthode>.join.csv` (colonnes `methode`, `certitude`,
  `niveau_incertitude`, `score`) ; seules les paires `apparié` ?
- numrev apparie aussi les rubriques entre éditions (`alignment/sections.py`,
  cas 1-N) : arcs temporels entre sections, dans une table à part.
- Extension « voisins temporels » et « composante » par `WITH RECURSIVE`
  (SQL déjà esquissé dans `docs/MODELE_DONNEES.md`, à conserver).

## 2026-10-30 — Analyse des données et proposition de modèle

**Fait**
- Lecture de `data/1807_AD75-PER292.document.json` et `.structure.json`, et de
  la spec `format_export.md` du projet voisin (lecture seule).
- Proposition de modèle de données : `docs/MODELE_DONNEES.md` (structure des
  sources, schéma Drizzle commenté, diagramme, SQL du sous-graphe induit).
- Aucun commit : dépôt Git pas encore initialisé (échafaudage en attente).

**Décisions**
- Aucune validée ; tout est proposé dans `docs/MODELE_DONNEES.md`.

**Questions ouvertes**
- `data/` dans Git (28,7 Mo par volume) ?
- Nœud = entrée (proposé) ou membre de groupe à accolade ?
- Source des images IIIF des pages ?
- Source des métadonnées des volumes (libellé, titre, années) ?
- Format d'import des liens temporels (jointure numrev) ?
- Succession à travers les sections ou non ?
- Extension `unaccent` ?
- Renvois « voyez » : arcs explicites plus tard ?

**Suite**
- Après validation du modèle : proposer l'arborescence et la liste exacte des
  dépendances.
