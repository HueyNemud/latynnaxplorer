# Journal de développement

## 2026-11-18 — Sprint 3 : concept de design

**Fait**
- PR #12 (préparation du sprint 3) fusionnée.
- Le sprint « première page, vue Liste » est abandonné avant tout code :
  mieux vaut fixer d'abord les principes d'UX et d'UI.
- `docs/DESIGN.md` : objectif, profils, cinq domaines, sélection et vues
  orthogonales, fonctionnalités, représentations d'un nœud, principes
  d'affichage (ee3d769, c51edd1, 3c49c5d, 12ea974).
- `docs/SPRINTS.md` réécrit : fiche d'un nœud, vue Liste, sélection par
  le contenu, export.

**Décisions**
- Concept de design, principes d'affichage, mesurer et relier écartés :
  voir `docs/DECISIONS.md`.
- Le mot « aspect » est abandonné : il mêlait critères de sélection et
  vues ; on dit désormais domaine (données) et vue (affichage).

**Suite**
- Sprint 4, la fiche d'un nœud : commencer par la fiche de composant
  (skill `design:design-system`), puis discuter de ce que `resolve` doit
  renvoyer en plus.

## 2026-11-18 — Préparation du sprint 3 : dépendances

**Fait**
- PR #11 (sprint d'entretien) fusionnée.
- Application Next.js d'essai, hors du dépôt (Next 16.4.6, React 19.3.1,
  TypeScript 7.0.2, `postgres` 4.1.1) : `next build` passe et échoue bien
  sur une erreur de type ; une page serveur lit `?subtree=` et interroge la
  base de développement (lecture seule).
- Conflit relevé : Next impose `moduleResolution: bundler`, refusé par
  TypeScript avec `module: nodenext`. `module: esnext` + `bundler`
  fonctionne et Next ne retouche plus `tsconfig.json` ; un import relatif
  sans extension passe alors `tsc` mais casse Node : la règle Biome
  `useImportExtensions` le signale et le corrige en `.ts`.

**Décisions**
- Dépendances du sprint 3, réglages qui les accompagnent, `nuqs` reporté :
  voir `docs/DECISIONS.md`.

**Suite**
- Contenu d'une ligne de la vue Liste à discuter (pistes dans
  `SPRINTS.md`), puis branche du sprint 3.

## 2026-11-18 — Sprint d'entretien : mises à jour majeures

**Fait**
- PR #10 (sprint 2) fusionnée.
- Les deux PR Renovate partaient encore de la fusion de la PR #1 : leur CI
  verte ne passait ni `lib/query/` ni la base de test. Rebasées (case de
  Renovate) ; CI verte ensuite, tests du sprint 2 compris.
- #7, `postgres` 3.4.9 → 4.1.1. Changements de la v4 qui pourraient nous
  toucher : types des paramètres décidés par le serveur (`infer: false`),
  `sql.array()` retiré, `BEGIN` hors `sql.begin` rejeté, types en module ES.
  Rien de cela n'est utilisé ici. En local : lint, typecheck, 34 tests ;
  1807 importé dans deux bases neuves, avec la v3 et avec la v4 : contenu
  des cinq tables identique (empreinte md5 par table) ; sous-graphes de
  `resolve` identiques sur les 803 sous-arbres habituels.
- #8, TypeScript 6.0.3 → 7.0.2 (compilateur natif). `tsconfig.json`
  n'utilise aucune option retirée ; les nouveaux défauts sont fixés chez
  nous (`strict`, `module`, `target`, `types`) ou sans effet sur le
  typecheck. TypeScript 7 n'a plus d'API JavaScript : seul cosmiconfig (par
  commitlint) en dépend, et seulement pour une configuration en `.ts` ; la
  nôtre est dans `package.json`. En local : lint, typecheck, 34 tests,
  commitlint (message accepté, message non conventionnel refusé), `tsc`
  qui échoue bien sur une erreur de type. Typecheck : 0,3 s contre 1,3 s.

- #7 et #8 fusionnées par l'utilisateur, sans conflit. Les deux ensemble
  sur `main` : lint, typecheck, 34 tests.

**Suite**
- Revue de `SPRINTS.md` avec l'utilisateur avant le sprint 3 (première
  page, vue Liste).

## 2026-11-18 — Sprint 2 : premier scénario, un sous-arbre

**Fait**
- PR #2 (intégration continue) fusionnée ; Renovate installé. PR #9
  (PostGIS 18) fermée : on reste sur PostgreSQL 17.
- `docs/SCENARIOS.md` : scénario 1, un nœud et tout son sous-arbre ;
  `SPRINTS.md` : sprint 2 en cours, sprint d'entretien (#7, #8) — `f6a04a9`.
- `lib/db/client.ts` et `scripts/load.ts` séparés de l'import ; réimport de
  1807 identique (22 158 nœuds, 45 673 empans, 22 017 ancres) — `a4b4ee9`.
- Base de test recréée par Vitest (`scripts/test-database.ts`), service
  PostgreSQL dans la CI ; premier test du chargement — `31df472`.
- `lib/query/query.ts` : `?subtree=<uuid>` lu et écrit — `c94e115`.
- `lib/query/resolve.ts` : sous-graphe induit, nœuds dans l'ordre de
  lecture, arcs déduits ; 30 tests — `8992489`.
- 1807 : les 603 rubriques sont d'un seul tenant dans l'ordre de lecture ;
  603 rubriques pour 521 libellés (désignation par uuid) ; 7 niveaux.
- Entrée suivante par `lead()` sur la plage du sous-arbre plutôt qu'une
  sous-requête par entrée : sous-graphes identiques sur 803 sous-arbres de
  1807 (toutes les rubriques et 200 autres nœuds).
- Pistes sans parcours de l'arbre notées dans `IDEES.md`, mesurées : table
  de fermeture des sections, sous-arbre en plage de rangs.
- Table `parent_closure` (fermeture des nœuds parents) calculée à l'import,
  1 515 lignes pour 1807 ; `drizzle-kit push` reste sans changement au
  second passage (PostgreSQL 17) — `1b8bc12`.
- Sous-arbre lu dans `parent_closure`, sans `WITH RECURSIVE` ; `UNION ALL`
  plutôt que `OR`, qui relisait toute la table — `e8b7992`. Sous-graphes
  identiques à la requête d'origine sur les 803 sous-arbres ; 33 tests.
- Temps restant décomposé, vu de Node (51 ms pour 13 737 nœuds) : SQL 20,
  transfert et lecture des lignes 15, TypeScript 6. Écartés : plan
  générique des requêtes préparées (sans effet), `json_agg` (plus lent).
- `follows` stocké dans `node.next_entry_id`, calculé à l'import ; nœuds
  insérés en une instruction pour la clé étrangère ; 20 708 arcs, identiques
  à `lead()` sur tout le volume — `a865f1c`. `resolve` lit la colonne :
  plus aucun calcul en SQL — `504fd5f`. Sous-graphes toujours identiques
  sur les 803 sous-arbres ; 34 tests.
- Mesures (`MODELE_DONNEES.md`, section 4), SQL seul : 0,13 ms pour une
  petite rubrique, 1,5 ms pour 3 338 nœuds, 7,6 ms pour 13 737 (contre
  1,4 / 20 / 70 à 80 ms au début du sprint) ; 35 ms vu de Node pour le
  plus gros.
- Base locale à remettre à niveau après récupération de la branche :
  `pnpm db:load`.

**Décisions**
- Voir `docs/DECISIONS.md` : scénarios, motifs d'URL en anglais, filtre
  `subtree` générique, erreurs, arcs en TypeScript, base de test, API JSON
  plus tard.
- Pas de changement du schéma pour la performance (décision de
  l'utilisateur) : l'hypothèse « rubriques d'un seul tenant », vraie sur
  1807, est à mieux vérifier dans numrev avant de s'en servir ; pas de
  demande à numrev pour l'instant.

**Questions ouvertes**
- Messages d'erreur en français dans le code : à traduire quand
  l'interface les montrera (application internationale).

- Table de fermeture adoptée (`parent_closure`, nœuds parents de tout
  type, pas seulement les sections) : simple, exacte, tenue par l'import.
- `follows` stocké : les trois arcs suivent le même principe (une colonne
  de `node`). Revient sur la décision du 30 octobre, qui attendait les
  requêtes réelles de `lib/query/`.

- Index `node (volume_id, kind, document_reading_order, id)` supprimé : il
  ne servait qu'au calcul de `follows` (décision de l'utilisateur) ; temps
  inchangés.

**Suite**
- Fusion de la PR, puis revue de `SPRINTS.md` : sprint d'entretien ou
  deuxième scénario.

## 2026-11-18 — Sprint 1 : intégration continue

**Fait**
- PR #1 (modèle de données) relue et fusionnée par merge commit.
- `docs/SPRINTS.md` : modèle de données fait, sprint 1 en cours — `f4e2335`.
- CI `.github/workflows/ci.yml`, job `verification` : `pnpm/setup@v3`
  (pnpm 12.3.4 lu dans `packageManager`, Node 26, cache, lockfile figé),
  puis lint, typecheck et les 14 tests ; ≈ 20 s — `d6a4523`.
- `renovate.json` validé contre le schéma de Renovate 44 — `e8418e7`.
- Protection de `main` posée par l'API GitHub (voir les décisions) ; le
  check `verification` est bien exigé sur la PR #2.

**Décisions**
- Voir `docs/DECISIONS.md` (CI, protection, Renovate, mode de fusion).
- `pnpm/setup` plutôt que `pnpm/action-setup` + `actions/setup-node` :
  l'action recommandée par pnpm à partir de la version 11, une seule étape.

**Questions ouvertes**
- Protection d'un dépôt privé : réglée, GitHub l'accepte sur ce compte.
- Application GitHub Renovate à installer sur le dépôt (par l'utilisateur).
- `ubuntu-latest` passe à Ubuntu 26 depuis le 19 octobre 2026 (annonce
  GitHub) : rien à faire a priori.

**Suite**
- Fusion de la PR #2, puis revue de `docs/SPRINTS.md` et sprint 2
  (`lib/query/`).

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

## 2026-10-30 — Performances en lecture

**Fait**
- `member_of` validé pour les éléments hors champ.
- Mesure des requêtes de `MODELE_DONNEES.md` sur 1807 (`EXPLAIN ANALYZE`,
  cache chaud), puis optimisation sans changer le modèle :
  - index trigrammes partiels par `kind` et par `label`, en plus des
    généraux : recherche de sections 8,3 → 0,3 ms ;
  - index `follows` couvrant (`id` en clé) et `VACUUM (ANALYZE)` en fin
    d'import : parcours d'index seul ;
  - SQL de `follows` : `OFFSET 0` (évite la double évaluation), variante
    `lead()` pour les grandes sélections : arcs du volume 214 → 98 ms, et
    22 ms pour `follows` par `lead()` (résultats identiques, vérifié) ;
  - `compose.yaml` : `jit=off`, `random_page_cost=1.1`.
- Mesures et règles d'écriture des requêtes : `MODELE_DONNEES.md`, section 4.

**Décisions**
- Pas de changement du modèle pour la performance à ce stade.

- `follows` stocké, colonnes sans accents et chemin d'ancêtres : notés
  dans `docs/IDEES.md`, non faits (décision de l'utilisateur).

**Questions ouvertes**
- Aucune.

**Suite**
- `lib/query/` ou application Next.js, selon votre priorité.

## 2026-10-30 — Éléments hors champ importés

**Fait**
- numrev a traité la demande (`c3b94a0`, `2548ce1`, branche
  `stabilisation`) : tableau `out_of_scope` dans `numrev-structure/2`, pages
  partagées sans doublon.
- Nouvel export de 1807 copié dans `data/1807/` (accord donné) ; schéma
  recopié en `scripts/schemas/numrev-structure-2.schema.json`.
- Type de nœud `out_of_scope` ; import, fixture et tests adaptés (14 tests).
- 1807 : 22 158 nœuds dont 846 hors champ (90 à la racine), 22 017 ancres
  (89 hors champ sans boîte) ; `follows` inchangé (20 708 arcs) ; titres
  courants et numéros de page intercalés dans l'ordre de lecture.
- `drizzle-kit push` ajoute la valeur d'enum sans question ni recréation.

**Décisions**
- Nom du type : `out_of_scope`, comme le tableau numrev.
- Arc d'un élément hors champ vers sa rubrique : `member_of`, comme une
  entrée.
- Libellé OCR du bloc (nature probable de l'élément) non repris.

**Questions ouvertes**
- Aucune.

**Suite**
- `lib/query/` ou application Next.js, selon votre priorité.

## 2026-10-30 — Ordre de lecture et éléments hors champ

**Fait**
- `rank` (par type) remplacé par `document_reading_order` (tous nœuds du
  volume), index `(volume_id, kind, document_reading_order)` pour `follows` ;
  import, fixture et tests adaptés (14 tests). Vérifié sur 1807 : 20 708
  arcs `follows`, sections et entrées intercalées.
- Prompt pour numrev : `docs/demandes/numrev_hors_champ.md`.

**Décisions**
- Ordre de lecture = attribut ; `follows` = relation entre entrées, déduite.
- Hors champ non importés en attendant numrev (pas de rattrapage ici).

**Questions ouvertes**
- Retour de numrev sur les éléments hors champ (format, pages partagées).

**Suite**
- `lib/query/` ou application Next.js, selon votre priorité.

## 2026-10-30 — Échafaudage données : schéma, validation, import

**Fait**
- Dépôt Git initialisé ; outillage Node 26 / pnpm 12, TypeScript 6, Biome,
  Vitest, Lefthook (biome check + tsc au pre-commit, commitlint) —
  `4f137c4`, `c3b42c3`.
- Base PostgreSQL 17 + PostGIS via Docker Compose, extensions `pg_trgm`,
  `unaccent`, fonction `immutable_unaccent` — `659e440`, `aa751a7`.
- Schéma Drizzle du modèle v2 (`lib/db/schema.ts`) — `458539b`.
- Validation des fichiers d'un volume (ajv, schémas numrev) — `60f12c4`.
- Import (`scripts/import.ts`), scripts `db:import` / `db:load` —
  `34caa92`. 1807 : 21 312 nœuds, 45 673 empans, 21 260 ancres, en ≈ 5 s.
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
