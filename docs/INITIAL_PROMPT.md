# Site d'exploration des annuaires commerciaux

## État initial

Ce dépôt est vide. Il doit devenir le site web d'exploration visuelle des annuaires
commerciaux traités dans le projet `../adresses_revolutionnaires`.
Ce projet voisin peut être lu pour comprendre la chaîne de traitement, mais ne doit
jamais être modifié.

Un premier livrable, l'annuaire de 1807, est disponible dans `./data/1807`. Il comprend
deux fichiers JSON :
1. `*.document.json` : l'accroche à la source. Il contient toutes les informations
   extraites du PDF original (pages, positions, etc.).
2. `*.structure.json` : la sortie de la chaîne de traitement. Il contient l'extraction
   structurée de l'annuaire (hiérarchie, entrées, champs).

D'autres annuaires suivront. Leurs entrées seront liées d'un annuaire à l'autre pour
suivre un même individu dans le temps, et les adresses seront géocodées.

## Principe fonctionnel

L'objet central est un **sous-graphe induit d'entrées** :
- une requête, sérialisée dans l'URL, sélectionne des entrées (les nœuds) ;
- les arcs sont tous les liens existant entre ces entrées ; ils se déduisent de la
  sélection et ne sont jamais choisis séparément.

Deux types d'arcs :
- **temporels** : liens entre entrées d'annuaires successifs (même individu) ;
- **documentaires** : appartenance à une section de la hiérarchie, succession dans
  le texte.

Cas particuliers du même objet :
- une fiche entrée est un sous-graphe d'un seul nœud ;
- un annuaire parcouru est le sous-graphe de toutes ses entrées ;
- une lignée est une composante connexe selon les arcs temporels.

Tout sous-graphe s'affiche selon 4 vues : Liste, Document (page source avec l'entrée
surlignée), Carte, Temps (frise avec une ligne par lignée). L'ordre d'affichage dépend
de la vue (ordre du document, alphabétique, chronologique), pas de l'objet.

Seulement 3 opérations :
- **filtrer** : restreindre les nœuds (champs, facettes, zone sur la carte, période) ;
- **étendre par les liens** : ajouter les voisins temporels, ou la composante entière ;
- **ouvrir une entrée** : passer au sous-graphe d'un seul nœud.

Le graphe reste stocké en relationnel dans PostgreSQL (tables d'entrées et de liens),
sans base de données ni librairie de graphes.

## Stack et structure du projet

- Next.js (App Router), TypeScript strict, pnpm. La priorité absolue est la simplicité
  du code et de la maintenance : aucune dépendance non justifiée.
- État de la requête dans l'URL via `nuqs`.
- Données : PostgreSQL + PostGIS + pg_trgm (recherche tolérante), lancés via Docker
  Compose. Accès en SQL typé avec Drizzle, sans ORM lourd. Requêtes dans des Server
  Components ou des Route Handlers. Les parcours de liens utilisent des jointures ou
  des requêtes récursives SQL (`WITH RECURSIVE`).
- Bibliothèques d'affichage : MapLibre GL pour la carte, OpenSeadragon (IIIF) pour les
  pages sources, frise en SVG simple sans librairie de graphes.
- Qualité : Biome pour le lint et le formatage, `tsc --noEmit`, Vitest pour les tests.
- Hooks Git obligatoires avec Lefthook :
  - pre-commit : `biome check` et typecheck sur les fichiers modifiés ;
  - commit-msg : Conventional Commits (commitlint).
- CI GitHub Actions sur chaque PR : install, lint, typecheck, test, build. La branche
  `main` est protégée.
- À fournir : README (lancement en 3 commandes), `.env.example`, `.editorconfig`,
  configuration Renovate, et un script d'import qui charge `./data/1807` en base.
- Arborescence plate et lisible : `app/`, `components/`, `lib/db/`, `lib/query/`
  (parsing et sérialisation de la requête, résolution en sous-graphe), `scripts/`
  (import), `docs/`.

## Règles d'or

- Code simple et explicite. Une abstraction ou un design pattern n'est introduit que
  lorsqu'il résout un problème présent, jamais par anticipation.
- Toujours demander avant de modifier l'architecture.
- Toujours demander avant d'ajouter une fonctionnalité, même mineure.
- Toujours demander avant de modifier le modèle de données.
- Toujours demander avant d'ajouter une dépendance.
- Par défaut, pas de rétro-compatibilité. Pas de migrations à maintenir : nous sommes
  en phase de développement initial, le schéma est appliqué directement
  (`drizzle-kit push`) et la base peut être recréée à tout moment.
- Ne jamais modifier les fichiers de `./data/` : ce sont des sources en lecture seule.
  Vérifier avec moi s'il faut exclure `data/` du dépôt Git selon leur volume.
- Petits commits atomiques. Chaque commit passe les hooks ; ne jamais les contourner
  (`--no-verify` interdit).
- En cas de doute sur les données ou l'intention, poser la question plutôt que supposer.

## Première étape : le modèle de données

1. Lire `./data/1807/*.document.json` et `*.structure.json`, puis me présenter leur
   structure de façon synthétique : objets, champs, volumétrie, irrégularités repérées.
2. Proposer un modèle de données centré sur les entrées (nœuds) et leurs liens (arcs),
   couvrant :
   - l'annuaire (édition, année, source) ;
   - la hiérarchie documentaire (sections, sous-sections) et l'ordre de lecture ;
   - l'entrée et ses champs structurés (nom, activité, adresse…) ;
   - l'ancrage dans la source (page, boîte englobante) ;
   - l'adresse et son géocodage (géométrie, score, méthode) ;
   - les arcs : liens temporels entre entrées (table prévue dès maintenant, même vide,
     avec type et score de confiance) et relations documentaires.
   Indiquer pour chaque relation documentaire si elle est stockée comme arc explicite
   ou dérivée de colonnes (section, rang dans le texte), avec la justification.
3. Me le présenter sous forme de schéma Drizzle commenté et d'un diagramme, avec les
   choix discutables explicitement signalés.
4. Montrer en SQL comment une requête simple est résolue en sous-graphe induit
   (nœuds puis arcs), et comment se fait l'extension à une composante temporelle.
5. Attendre ma validation avant tout code d'échafaudage.

Ensuite seulement : proposer l'arborescence et la liste exacte des dépendances, attendre
ma validation, puis mettre en place l'échafaudage.

## Journal de développement

Tenir `docs/JOURNAL.md`, mis à jour à la fin de chaque session de travail ou étape
significative, avec des entrées datées les plus récentes en haut. Chaque entrée
contient :
- **Fait** : ce qui a été réalisé (avec les commits concernés) ;
- **Décisions** : choix faits et leur justification en une ligne ;
- **Questions ouvertes** : points en attente de ma réponse ;
- **Suite** : prochaine étape proposée.
Les décisions structurantes (modèle de données, architecture) sont aussi résumées dans
`docs/DECISIONS.md`, une ligne par décision.
