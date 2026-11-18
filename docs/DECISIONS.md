# Décisions structurantes

Une ligne par décision, la plus récente en haut.

- 2026-11-18 — Concept de design (`docs/DESIGN.md`) : objectif = exploration visuelle, sélection et export du contenu des annuaires ; cinq domaines (Contenu, Structure, Document, Espace, Temps) qui servent indépendamment à sélectionner (critères combinés, dans l'URL) et à afficher (une vue dispose la sélection selon un domaine) ; fonctionnalités : sélectionner, suivre, inspecter, exporter.
- 2026-11-18 — Principes d'affichage : chaque vue montre la sélection dans son contexte, distinct d'elle ; densité automatique (un nœud → fiche, plusieurs → compacte) ; une vue à la fois pour commencer, focus pensé comme partagé ; la page source à un clic depuis tout nœud.
- 2026-11-18 — Mesurer et relier écartés (`docs/IDEES.md`) : l'analyse revient aux historiens, à partir de l'export.
- 2026-11-18 — Sprint 3, dépendances : `next`, `react`, `react-dom`, et en développement `@types/react`, `@types/react-dom` (versions exactes, prises au début du sprint) ; rien d'autre (pas d'ESLint, de bibliothèque de styles ni de tests React). Next.js 16.4.6 vérifié avec TypeScript 7 et `postgres` v4 sur une application d'essai.
- 2026-11-18 — `nuqs` reporté : au sprint 3 la page ne fait que lire `?subtree=` côté serveur, ce que fait déjà `lib/query/query.ts`. À reprendre à la première modification de la requête dans le navigateur (voir `docs/IDEES.md`).
- 2026-11-18 — Avec Next.js, `tsconfig.json` passe à `module: esnext` et `moduleResolution: bundler` (Next impose `bundler`, incompatible avec `nodenext`), plus `jsx`, `lib` `dom`, le plugin `next` et les options que Next ajoute d'office (`allowJs`, `incremental`, `esModuleInterop`, `isolatedModules`). La règle Biome `useImportExtensions` garde les extensions `.ts` dont Node a besoin pour les scripts. CI : étape `pnpm build` ; `.next/` et `next-env.d.ts` ignorés ; `sharp` (optionnel de Next) déclaré dans `allowBuilds`.
- 2026-11-18 — `follows` stocké dans `node.next_entry_id` (clé étrangère sans cascade), calculé à l'import : `member_of`, `child_of` et `follows` sont tous trois portés par une colonne. Remplace « `follows` calculé, non stocké » (30 octobre), revu une fois mesurées les requêtes de `lib/query/`.
- 2026-11-18 — Nœuds d'un volume insérés en une seule instruction (`jsonb_to_recordset`) : clé étrangère vers l'entrée suivante vérifiée en fin d'instruction (Drizzle ne déclare pas de contrainte différée).
- 2026-11-18 — Table `parent_closure (ancestor_id, descendant_id)` : fermeture des nœuds qui ont des enfants (les sections, dans numrev), calculée à l'import, pour lire un sous-arbre sans parcours récursif ; exacte sans hypothèse sur le type des parents ni sur l'ordre de lecture.
- 2026-11-18 — Pas de colonne fondée sur l'hypothèse « rubriques d'un seul tenant » : à mieux vérifier dans numrev d'abord.
- 2026-11-18 — Format de l'API JSON : à décider à la première API HTTP, selon une pratique standard (OpenAPI ou plus récent), pas un formalisme ad hoc.
- 2026-11-18 — Tests contre une vraie base : `<base>_test` recréée par Vitest à chaque lancement, en local (conteneur Docker) et en CI (service PostgreSQL) ; `lib/db/client.ts` partagé par l'import, les tests et `lib/query/`.
- 2026-11-18 — Arcs du sous-graphe déduits en TypeScript des lignes de la requête (parent, entrée suivante) : une seule requête SQL par résolution.
- 2026-11-18 — Uuid inconnu : erreur (`NodeNotFoundError`) ; uuid mal formé, paramètre absent ou répété : requête invalide (`QueryError`).
- 2026-11-18 — Filtre `subtree` générique : un nœud de n'importe quel type et tous ses descendants ; sans filtre explicite, tout ce qui est désigné est rendu (`lib/query/` ne juge pas de la pertinence).
- 2026-11-18 — Motifs d'URL en anglais (application internationale) : `?subtree=<uuid>`.
- 2026-11-18 — Requêtes conçues par scénarios (`docs/SCENARIOS.md`) : chacun donne un filtre combinable et ses tests.
- 2026-11-18 — PR fusionnées par merge commit (ni squash ni rebase) : les hashes cités dans le journal restent valides.
- 2026-11-18 — Renovate : chaque lundi matin (heure de Paris), mises à jour mineures et correctifs en une PR, majeures à part, aucune fusion automatique.
- 2026-11-18 — `main` protégée, administrateurs compris : fusion par PR seulement, check `verification` vert exigé, sans relecture obligatoire (mainteneur seul), ni force-push ni suppression.
- 2026-11-18 — CI GitHub Actions (job `verification`) : lint, typecheck, tests ; pnpm et Node 26 par `pnpm/setup`, lockfile figé ; pas de base PostgreSQL tant que les tests n'en ont pas besoin.

- 2026-10-30 — Un sprint = une branche ; `main` ne reçoit que des PR relues et fusionnées par l'utilisateur ; dépôt GitHub privé `hueynemud/latynnaxplorer`.

- 2026-10-30 — Lecture rapide sans changer le modèle : index trigrammes partiels par `kind` / `label`, index couvrant pour `follows`, `VACUUM (ANALYZE)` après import, `jit=off`, `random_page_cost=1.1`.
- 2026-10-30 — Éléments hors champ importés comme nœuds `out_of_scope` (numrev-structure/2), arc `member_of` vers leur rubrique ; `follows` inchangé.
- 2026-10-30 — Éléments hors champ : futurs nœuds, mais seulement quand numrev les exportera comme entités (uuid, parent) ; pas importés d'ici là.
- 2026-10-30 — `follows` = l'entrée suivante dans cet ordre (entrées seulement), calculée, non stockée.
- 2026-10-30 — Ordre de lecture = attribut `node.document_reading_order`, commun à tous les nœuds du volume (remplace `rank` par type).

- 2026-10-30 — Étendue actuelle : données seulement (modèle, import, validation) ; pas de site, pas de CI ni Renovate avant le sprint GitHub.
- 2026-10-30 — PostgreSQL 17 (et non 18) : avec 18, drizzle-kit 0.31 recrée les contraintes composites à chaque push.
- 2026-10-30 — Import validé contre les JSON Schema de numrev (copiés dans `scripts/schemas/`) avec ajv ; volume.json a son propre schéma.
- 2026-10-30 — Node 26, pnpm 12, dépendances en versions exactes.

- 2026-10-30 — Données d'un volume dans `data/<volume>/` (les JSON de 1807 déplacés dans `data/1807/`).
- 2026-10-30 — Géocodage hors modèle pour l'instant : sprint dédié, rattaché aux uuid des empans ADDR.

- 2026-10-30 — Métadonnées d'un volume dans `data/<volume>/volume.json` : éléments Dublin Core + `temporal` {start, end} en AAAA-MM-JJ.
- 2026-10-30 — Aucune donnée versionnée pour l'instant (`data/` entièrement hors Git).
- 2026-10-30 — Pas de table de liens temporels : extension future, sprint dédié.
- 2026-10-30 — Sections et entrées traitées de la même manière ; schéma minimal et commun.
- 2026-10-30 — numrev fait foi : import tel quel, aucun rattrapage des données dans l'application.
- 2026-10-30 — Nœud = entrée numrev (un groupe à accolade est un seul nœud, comme dans l'export).

- 2026-10-30 — Recherche insensible aux accents : extension PostgreSQL `unaccent` en plus de `pg_trgm`.
- 2026-10-30 — Succession (`follows`) entre entrées seulement, dans l'ordre de lecture de tout l'annuaire, à travers les sections.
- 2026-10-30 — Sous-graphe toujours induit strict : aucun nœud ajouté implicitement.
- 2026-10-30 — Nœuds = entités typées `entry` et `section` ; volume, page et empan restent des attributs.
- 2026-10-30 — Arcs documentaires `member_of` (entrée → section) et `child_of` (section → section) portés par des colonnes, sans table d'arcs générique.
- 2026-10-30 — Un seul annuaire pour commencer : pas de liens temporels dans le modèle pour l'instant.
- 2026-10-30 — IIIF reporté : le PDF sera servi plus tard par un serveur IIIF.
- 2026-10-30 — `data/` exclu du dépôt Git.
