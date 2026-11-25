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
  composants portent `.rt-reset` et ont leur propre anneau de focus. Un
  `TextField.Slot` sans `side` se place selon son rang (le premier à
  gauche) ; un bouton `ghost` a des marges négatives : deux voisins se
  chevauchent.
- **CSS** : `calc()` refuse un `0` sans unité dans une somme ; épaisseurs en
  pixels entiers (1,5 px s'affiche tantôt sur 1, tantôt sur 2) ; Firefox
  fond la marge haute d'un premier enfant dans celle de son parent, et
  sous-estime en flexbox la largeur d'un texte dont des enfants ont des
  marges négatives.
- **Fonds transparents** : un même fond coupé en plusieurs éléments à
  marges négatives se chevauche en bandes plus foncées ; un fond posé sur
  un autre transparent change de teinte avec lui. Un empan = un élément ;
  un fond par-dessus est opaque.
- **Biome** : `noDescendingSpecificity` (une règle qui en surcharge une
  autre vient après elle), `useSemanticElements` (`<search>` plutôt que
  `role="search"`), `useImportExtensions`.
- **Lefthook** : un `glob` laisse passer sans contrôle tout fichier qu'il
  ne couvre pas (« no files for inspection ») ; le lint n'en a donc pas,
  Biome trie lui-même selon `biome.json`. Celui du typage doit suivre les
  extensions TypeScript. Après un clone ou un déplacement,
  `pnpm exec lefthook install` réécrit les hooks de `.git/`.
- **Accessibilité** : une case dans un `<summary>` lui donne un nom à
  rallonge ; le nommer par `aria-labelledby` vers l'intitulé seul.
- **Captures headless** : `Emulation.setDeviceMetricsOverride` (pas
  `--window-size`) ; pour un focus clavier, `setFocusEmulationEnabled` ou
  une touche, puis `focus()`. Ouvrir un `<details>` et cliquer dedans dans
  le même `Runtime.evaluate` donne un faux résultat : laisser un délai.
- **Profiler en production** : `pnpm next build --no-mangling --profile`
  garde les noms des fonctions dans un profil CPU et active `<Profiler>`.
  Une navigation de Next est une transition : `useDeferredValue` y rend
  aussitôt la nouvelle valeur.
- **`:has()`** : quand la page grandit (tranches), Chromium recalcule le
  style de tout ce qu'un `:has()` peut toucher ; préférer un attribut ou
  une règle sans `:has()`.
- **Radix, menus** : `DropdownMenu.Trigger` impose son `disabled` au
  bouton qu'il enveloppe ; mettre `disabled` sur le déclencheur.
- **Flexbox qui passe à la ligne** : la coupure se décide sur la base
  (`flex-basis`, par défaut la largeur du contenu), pas sur `min-width` ;
  donner la base voulue (le champ de recherche : `16rem`).
- **commitlint** : le sujet ne commence pas par une majuscule, même un
  nom de type (`renommer FacetVolume…`, pas `FacetVolume devient…`).

## 2026-11-25 — Volume au focus (sprint 24)

- La sélection (vue, recherche, export) ne porte que sur le volume au
  focus, dans l'URL (`volume`) ; seul lui se télécharge. Changer de volume
  garde la recherche et ses zones, retire les rubriques cochées.
- Case ronde sur la seule vignette au focus ; un `subtree` hors du volume
  est une erreur. Code multi-volume retiré (`neededVolumes`, `volumeOf`,
  `volumeId` des rubriques).

## 2026-11-25 — Annuaire de l'an XIII

- `1804-1805_BNF-bpt6k62915570-LaTynnaAnXIII` exporté (24 183 nœuds,
  7,7 Mo) et publié avec 1807, sans changement de code ; `temporal` du
  1er vendémiaire an XIII au dernier jour complémentaire (1804-09-23 –
  1805-09-22).

## 2026-11-25 — Hors champ et réglages (sprint 22)

- Les éléments hors champ sont écartés de la sélection (Liste, recherche,
  export) ; la case « Show out-of-scope elements » les rétablit.
- Le bouton ⚙ ouvre les réglages de l'application : une section General,
  puis une par vue (List : Span colors). Le trait des outils de la vue
  est retiré.

## 2026-11-25 — Barre et retours (sprint 21)

- Suite d'un audit UX/UI. La barre passe à la ligne au lieu d'écraser le
  champ ; le nom du volume au focus est le titre de l'onglet.
- Export ouvre un menu des formats (CSV pour l'instant) ; le décompte de
  la sélection est dans l'en-tête de la Liste.
- Un clic sur une zone relance la recherche quand un texte est cherché.
- Adresses en rose, correspondances en jaune surligneur.
- Icônes de `@radix-ui/react-icons` : `components/icons.tsx` retiré.

## 2026-11-25 — Nettoyage (sprint 20)

- Docs remises d'accord avec le code (requête vide, schéma des facettes),
  mesures et demande à numrev traitée retirées ; le brief initial, dont la
  stack est abandonnée, est supprimé, ses règles d'or passent dans
  `CLAUDE.md`.
- Code mort : calcul des arcs (`resolve`, `inducedArcs`, `nextEntry`),
  qu'aucune vue n'utilisait ; ils seront calculés pour la vue qui les
  montrera.
- Fiche au dépliage par `onToggle` de React dans chaque ligne, à la place
  d'un écouteur global et d'un portail hérités du rendu serveur ; mesuré
  en production, sans coût.
- Une seule fonction `ancestors` ; sélection et surlignage sur le même
  découpage en zones (`zonePieces`) ; barre en `Flex` de Radix ;
  commentaires et CSS resserrés, rendu identique au pixel près.

## 2026-11-25 — Barre de la sélection (sprint 19)

- La barre au-dessus de la vue sépare ce qui est commun aux vues (zones,
  champ, Export : la barre de la sélection) de ce que fournit la vue (pour
  la Liste, le menu « ⚙ »), par un trait vertical (`Separator` de Radix).
  Avec plusieurs vues, chacune aura son en-tête ; aucun changement de
  comportement.

## 2026-11-24 — Requête vide = tout (sprint 18)

- Modèle standard des facettes : un critère absent ne filtre rien. Sans
  rubrique ni recherche, tous les volumes sont sélectionnés et montrés par
  tranches (première ligne en 650 ms sur 1807) ; « Nothing to show » et le
  bouton All, redondant, disparaissent.
- Une case de Contents estompe la Liste dès le clic, et l'URL ne l'attend
  plus que 100 ms (300 avant) : Liste à jour en 220 à 280 ms au lieu de
  420 à 460.

## 2026-11-24 — Réglages d'affichage (sprint 17)

- Bouton « ⚙ » au bout de la barre de la vue : menu de Radix, une case
  Span colors qui montre ou cache les fonds des empans ; mémorisée dans
  `localStorage` (`components/Settings.tsx`). Cacher les éléments hors
  champ : reporté (`docs/IDEES.md`).

## 2026-11-24 — Surlignage (sprint 16)

- Correspondances du texte cherché surlignées dans les lignes de la Liste,
  aux endroits mêmes qui sélectionnent (`lib/text/matches.ts` ; vérifié
  sur 1807 : aucun écart avec la sélection sur douze recherches). Fond
  `--iris-6` opaque, choisi sur captures ; jaune des adresses éclairci.
- Un empan coupé par l'emphase ou une correspondance reste un seul
  élément : les fonds ne se chevauchent plus.

## 2026-11-24 — Export CSV (sprint 15)

- Bouton Export au bout de la barre de la vue : toute la sélection en CSV,
  une ligne par nœud, une colonne par niveau de rubrique et par libellé
  d'empan (`lib/export/csv.ts`, `docs/DESIGN.md`, « Export »). Tout 1807 :
  7,6 Mo, 7 niveaux, 80 ms.
- Pas d'API JSON pour l'instant. Pistes reportées dans `docs/IDEES.md`
  (ancres, adresse de la requête, autres formats).

## 2026-11-24 — Mise en ligne

- Dépôt public ; site publié sur GitHub Pages à chaque arrivée sur `main`,
  sous `/latynnaxplorer` (`basePath`, que `usePathname` omet : ajouté aux
  adresses écrites dans l'historique). Volumes pris dans la release
  `volumes`.

## 2026-11-23 — Vocabulaire et docs

- Un terme par objet (table en tête de `docs/DESIGN.md`) dans les docs,
  les commentaires, les tests et les noms de classes CSS (`View` devient
  `Exploration`) ; français sans calques de l'anglais (case à cocher, fond
  coloré). Rendu identique au pixel.
- Chaque fait à un seul endroit : `DECISIONS.md` à une ligne par décision,
  fiches resserrées ; docs : 300 lignes de moins.

## 2026-11-23 — Sprint 14 : sélection et vues (PR #29)

- Sélection et décomptes communs à toutes les vues ; la Liste en ajoute
  le contexte de ce qu'elle montre, par tranches de 200 nœuds ajoutées au
  défilement. Groupes hors de l'écran ni calculés ni dessinés ; facettes
  rendues seulement si elles changent ; guides d'un seul gris foncé.
- « Listes particulières » s'affiche en moins de 0,1 s au lieu de 2,5 s.

## 2026-11-23 — Recherche par zone

- Le texte se cherche dans des zones : sujet, description, adresse, ou
  le reste (`in`). Boutons des zones à gauche du champ, aux couleurs des
  champs ; champ agrandi et soudé à un bouton Search. 116 tests.

## 2026-11-23 — Barre de la vue fixée

- La recherche reste accessible : en haut de la vue, une barre toujours
  visible (prête à recevoir les filtres) ; dessous, la liste défile seule,
  ses titres fixés sous la barre quelle que soit sa hauteur. La page ne
  défile plus ; seule la liste est estompée pendant un chargement.

## 2026-11-20 — Sprint 13 : audit et simplification du code (PR #24)

- Comportement inchangé, 105 lignes de moins. Code mort retiré ; une seule
  sélection par volume et un seul parcours des ancêtres (vue deux fois
  plus rapide) ; URL de la requête écrite une fois, composants qui
  reçoivent la requête ; commentaires sans historique ni redites ; CSS
  regroupée, rendu identique au pixel ; fixture chargée en un appel.
  108 tests.

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
