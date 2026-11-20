# Journal de développement

Ce qui a été fait, en bref, le plus récent en haut ; le détail est dans
`git log` et les PR, les décisions en vigueur dans `docs/DECISIONS.md`.
À chaque fin de sprint : quelques lignes ici, et les pièges nouveaux dans
« Pièges connus ».

## Pièges connus

- **Mesurer en production** (`next build`, puis servir `out/`, par exemple
  `python3 -m http.server -d out 3100`) : `pnpm dev` est 20 à 40 fois plus
  lent sur la Liste. Vérifier que le port est libre : un ancien serveur
  encore lancé répond à la place du nouveau.
- **Cache de navigation** (bfcache) : Chromium garde en mémoire les pages
  quittées qui y sont admises (une page statique, pas `/`) ; tas et nœuds
  DOM se cumulent d'une mesure à l'autre. Mesurer avec
  `--disable-features=BackForwardCache`.
- **Next** : un composant client gardé par une navigation ne relit pas son
  état initial ; `history.pushState` et `replaceState` tiennent
  `useSearchParams` à jour sans requête ; `useSearchParams` dans une page
  statique demande un `<Suspense>` autour.
- **Radix** : il définit `--space-*` et `--color-background` sur
  `.radix-themes` (nos jetons ne doivent pas reprendre ces noms) ; ses
  composants portent `.rt-reset` et ont leur propre anneau de focus.
- **CSS** : `calc()` refuse un `0` sans unité dans une somme ; épaisseurs en
  pixels entiers (1,5 px s'affiche tantôt sur 1, tantôt sur 2) ; Firefox
  fond la marge haute d'un premier enfant dans celle de son parent, et
  sous-estime en flexbox la largeur d'un texte dont des enfants ont des
  marges négatives.
- **Biome** : `noDescendingSpecificity` (une règle qui en surcharge une
  autre vient après elle), `useSemanticElements` (`<search>` plutôt que
  `role="search"`), `useImportExtensions`.
- **Accessibilité** : une case dans un `<summary>` lui donne un nom à
  rallonge ; le nommer par `aria-labelledby` vers l'intitulé seul.
- **Captures headless** : `Emulation.setDeviceMetricsOverride` (pas
  `--window-size`) ; pour un focus clavier, `setFocusEmulationEnabled` ou
  une touche, puis `focus()`.

## 2026-11-20 — Sprint 12 : données en local (PR #22, #23)

- Site statique : un fichier JSON par volume et un index, hébergés en
  ligne ; volumes chargés à la demande, requêtes résolues dans le
  navigateur (13 ms au plus sur 1807). 1807 : 1,3 Mo compressés.
- Le DOM reste le goulot des grosses sélections (2,1 s de style et de mise
  en page pour 13 737 lignes).

## 2026-11-20 — Sprint 11 : passage à Radix Themes (PR #21)

- Thème Radix iris sur gris mauve, ses jetons à la place des nôtres ;
  contrôles, fiche (DataList), vignette (Card) et vue vide en composants
  Radix ; feuille de style réduite à ce que Radix n'a pas (793 → 574
  lignes).
- Une seule navigation : lien « Open on its own page » et synchronisation
  des facettes retirés, fil d'Ariane en texte.
- Fiche demandée au premier dépliage : « Listes particulières » (13 737
  nœuds) passe de 81 à 26 Mo et de 3,8 à 1,2 s en production ; une fiche,
  7 ms.
- Filtre à la coche, All et Clear locaux au volume regardé ; une case
  couverte ne garde qu'elle au clic ; rubriques et volumes semi-sélectionnés
  (tiret).
- Champs teintés par les échelles transparentes de Radix (violet, sarcelle,
  jaune), choisis sur planche. 101 tests.

## 2026-11-20 — Sprint 10 : facettes et Liste d'accord (PR #20)

- Sans critère, rien n'est sélectionné (plus d'entrée par défaut) ; vue
  vide en grand aplat.
- Apply et Clear en haut de Contents (remplacés au sprint 11).

## 2026-11-20 — Sprint 9 : nettoyage du code (PR #19)

- Doublons retirés, règles des coches en fonctions pures testées, types
  séparés du SQL, feuille de style rangée par sections. 94 tests.

## 2026-11-20 — Sprint 8 : facettes de structure (PR #18)

- `subtree` répétable (union des sous-arbres) ; volumes et rubriques avec
  leurs décomptes (`lib/query/facets.ts`) ; panneaux Volumes et Contents ;
  cases rattachées au formulaire de la requête.

## 2026-11-19 — Sprint 7 : sélectionner par le contenu (PR #17)

- Recherche par texte exacte, sans accents ni casse, dans tout l'annuaire ;
  résultats regroupés sous toutes leurs rubriques ; champ de recherche.
  Similarité par trigrammes et plein texte mesurés et écartés.

## 2026-11-19 — Sprints 5 et 6 : la vue Liste (PR #15, #16)

- Maquettes revues à l'écran, puis liste à plat : guides de niveau, titres
  fixés et empilés, un seul `<details>` par nœud, Fira Sans.
- Lenteur ressentie : due au serveur de développement, pas au rendu.

## 2026-11-18 — Sprints 3 et 4 : concept de design, fiche d'un nœud (PR #12 à #14)

- `docs/DESIGN.md` (domaines, sélection et vues, représentations d'un nœud),
  avant tout écran.
- Dépendances de Next.js validées sur une application d'essai ; fiche d'un
  nœud en clés / valeurs ; 400 et 404.

## 2026-11-18 — Entretien et sprint 2 : requête → sous-graphe (PR #7, #8, #10, #11)

- Scénario 1 (un sous-arbre), base de test recréée par Vitest ;
  `parent_closure` et `follows` stocké : 7,6 ms en SQL pour 13 737 nœuds.
- `postgres` v4 et TypeScript 7 (typecheck 1,3 → 0,3 s), vérifiés par un
  réimport identique de 1807.

## 2026-11-18 — Sprint 1 : intégration continue (PR #2)

- CI GitHub Actions, protection de `main`, Renovate.

## 2026-10-30 — Modèle de données (PR #1)

- Analyse de l'export numrev ; modèle v2 (une table de nœuds, arcs portés
  par des colonnes) ; validation et import ; éléments hors champ importés
  après une demande à numrev ; index de lecture mesurés
  (`docs/MODELE_DONNEES.md`, section 4).
- 1807 : 22 158 nœuds (846 hors champ), 45 673 empans, 22 017 ancres, 603
  rubriques sur 7 niveaux.
