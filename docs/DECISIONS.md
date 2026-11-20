# Décisions structurantes

Les décisions en vigueur, par thème. Une décision remplacée est réécrite, pas
empilée : l'historique est dans `git log` et les PR. Une alternative écartée
n'est notée que si elle risque de revenir sur la table.

## Projet et outillage

- Un sprint = une branche ; `main` ne reçoit que des PR relues et fusionnées
  par l'utilisateur, par merge commit (les hashes cités restent valides).
  Dépôt GitHub privé `hueynemud/latynnaxplorer` ; `main` protégée (check
  `verification` exigé, ni force-push ni suppression).
- CI GitHub Actions (job `verification`) : lint, typecheck, tests avec un
  service PostgreSQL, build. Renovate le lundi matin : mineures groupées,
  majeures à part, aucune fusion automatique.
- Node 26, pnpm 12, dépendances en versions exactes. Next.js (App Router),
  `module: esnext` et `moduleResolution: bundler` ; la règle Biome
  `useImportExtensions` garde les extensions `.ts` dont Node a besoin.
- Tests contre une vraie base, `<base>_test`, recréée par Vitest à chaque
  lancement. Les règles d'état sans rendu (coches des facettes) sont des
  fonctions pures de `lib/`, testées sans navigateur ; les types rendus par
  les requêtes sont séparés du SQL (`lib/query/types.ts`).
- Interface en anglais ; le texte des annuaires n'est jamais traduit.

## Données et modèle (`docs/MODELE_DONNEES.md`)

- numrev fait foi : import tel quel, validé contre ses JSON Schema (ajv),
  aucun rattrapage ; un défaut se demande à numrev (`docs/demandes/`).
- PostgreSQL 17 (avec 18, drizzle-kit 0.31 recrée les contraintes
  composites à chaque push), extensions `pg_trgm` et `unaccent`. `data/`
  hors Git ; un volume par dossier `data/<volume>/`, ses métadonnées Dublin
  Core dans `volume.json`.
- Une table `node` pour tous les nœuds, typés `section`, `entry` ou
  `out_of_scope` ; un groupe à accolade est un seul nœud. Empans et ancres
  dans leurs tables (`span`, `anchor`).
- Arcs portés par des colonnes, sans table d'arcs : `member_of` et
  `child_of` par `parent_id`, `follows` par `next_entry_id` (entrée suivante
  dans l'ordre de lecture du volume, à travers les sections, calculée à
  l'import). Ordre de lecture : `document_reading_order`, commun à tous les
  nœuds.
- `parent_closure` (ancêtre, descendant), calculée à l'import : sous-arbres
  et ancêtres sans parcours récursif.
- Pas de colonne fondée sur l'hypothèse « rubriques d'un seul tenant »,
  tant que numrev ne la garantit pas.

## Requête (`docs/SCENARIOS.md`, `lib/query/`)

- La requête se lit dans l'URL et s'y réécrit à l'identique ; paramètres en
  anglais : `subtree` (répétable : union des sous-arbres) et `text`. Tous
  facultatifs, combinés en conjonction ; sans critère, rien n'est
  sélectionné. Sous-graphe toujours induit strict ; `lib/query/` ne juge
  pas de la pertinence.
- Requête mal formée : 400 (`proxy.ts`) ; uuid inconnu : 404.
- Recherche par texte : phrase entière, exacte, sans accents ni casse
  (`ILIKE` sur `immutable_unaccent`, index trigrammes), sur tous les nœuds ;
  dans les rubriques cochées, sinon tout l'annuaire. Écartées après mesure :
  similarité par trigrammes (trop de bruit) et plein texte de PostgreSQL
  (`docs/IDEES.md`, « Recherche tolérante »).
- `resolve` lit nœuds, empans et ancres en trois requêtes parallèles,
  rattachés en TypeScript (regrouper en SQL est deux fois plus lent) ; arcs
  déduits en TypeScript. Avec un texte, la sélection part de l'index
  trigrammes : partir du sous-arbre passe de 2 à 60 ms au plan générique des
  requêtes préparées.
- Contexte (`context`) : les rubriques ancêtres de la sélection qui n'en font
  pas partie, nœuds complets, jamais comptés dedans.
- Fiche d'un nœud : `GET /api/detail/<uuid>`, Route Handler interne en JSON
  (Next réserve les fonctions serveur aux écritures). Ce n'est pas l'API
  publique, dont le format suivra une pratique standard (OpenAPI ou plus
  récent), à trancher avec l'export.

## Interface (`docs/DESIGN.md`)

- Objectif : explorer, sélectionner et exporter le contenu des annuaires ;
  cinq domaines (Contenu, Structure, Document, Espace, Temps) servent
  indépendamment à sélectionner et à afficher. Mesurer et relier reviennent
  aux historiens, à partir de l'export.
- Sélection (ce que l'on retient, dans l'URL) et focus (ce que l'on regarde,
  hors de l'URL) distingués partout.
- Radix Themes pour toute l'interface, thème iris sur gris mauve : ses
  composants et ses jetons ; `app/globals.css` ne garde que ce que Radix n'a
  pas, et écrit sur place ce qui ne sert qu'une fois. Feuille de Radix
  importée entière (la découper ne gagnerait qu'environ 23 Ko compressés).
  Écartés sur maquette : Primer React (états mal distingués, identité de
  GitHub), shadcn/ui (Tailwind obligatoire). Police Fira Sans (vraies
  petites capitales), servie par `next/font`.
- Une seule navigation : seules les facettes et la recherche changent la
  sélection, aucun lien de la Liste. Pas de `nuqs`.
- Script assumé : sans lui, les facettes et la fiche au dépliage ne
  marchent pas.

## Vue Liste (`docs/composants/noeud-liste.md`)

- Liste à plat : la hiérarchie se lit par des guides de niveau (seul celui
  de la section la plus proche est foncé) et des titres de section fixés et
  empilés ; le contexte est rendu comme la sélection.
- Un seul élément pour tout nœud : une ligne (chevron, texte | page) qui
  déplie sa fiche par `<details>` natif ; deux états, survol et ouvert (en
  relief) ; les types ne se distinguent que par leur texte.
- Champs sur fond teinté transparent : sujet (violet, petites capitales),
  description (sarcelle), adresse (jaune).
- Fiche en DataList (texte, champs, métadonnées, fil d'Ariane en texte),
  demandée au premier dépliage ; une sélection d'un seul nœud l'a rendue et
  dépliée d'emblée.
- Tout est rendu, sans pagination pour l'instant (« Listes particulières »,
  13 737 nœuds : 26 Mo, 1,2 s en production ; `docs/IDEES.md`).
- Vue vide : un grand aplat, « Nothing to show » sans critère, « No match »
  sinon.

## Facettes (`docs/composants/facettes.md`)

- Colonnes de Miller collées à gauche (Volumes | Contents | vue), chacune
  repliable par une bande à droite, liées par niveau.
- Volume : coche ronde (tout le volume ou rien) ; clic sur la vignette =
  focus, Contents montre son arbre. Rubrique cochée = tout son sous-arbre,
  descendants couverts ; un volume est sélectionné si une de ses rubriques
  l'est. Les nœuds hors de toute rubrique ne se sélectionnent que par la
  recherche (racine demandée à numrev).
- Filtrer à la coche : chaque coche s'applique aussitôt, par une navigation
  client qui remplace l'entrée d'historique, après 300 ms sans nouvelle
  coche ; la vue est estompée pendant le chargement. Les cases sont l'état
  du composant, lu une fois depuis l'URL, que l'URL suit : aucune
  synchronisation.
- Contents est local au volume regardé (facettes hiérarchiques) : All et
  Clear ne touchent que lui.
- Intitulés dans la casse imprimée, décompte des entrées filtré par le texte
  cherché ; à l'arrivée, l'arbre est déplié jusqu'aux coches.
