# Composant : nœud dans la vue Liste

Fiche de composant. Elle décline la représentation d'un nœud dans la vue Liste
(`docs/DESIGN.md`, « Représentation d'un nœud ») et la façon dont la vue les
compose : densité compacte (la ligne) et détaillée (la fiche). Jetons et fiche
de Radix Themes. Essais écartés en fin de fiche.

## Problème

Montrer une sélection de nœuds tels que l'annuaire les imprime, champs
repérables d'un coup d'œil, dans leur hiérarchie de rubriques, sans que la
structure ne prenne le pas sur le contenu des entrées ; savoir à tout moment
où l'on est dans cette hiérarchie ; inspecter n'importe quel nœud sur place.
La Liste ne change pas la sélection : seules les facettes le font.

## Principe : une liste à plat, peu de règles

- **Une liste à plat** : pas de cadre autour des rubriques. La hiérarchie se
  lit par des **guides de niveau** (*indent guides*) : un filet vertical à
  gauche de chaque rubrique, coudé vers son titre, terminé par une boule.
- **Un seul élément** pour tout nœud, quel que soit son type : une ligne
  (chevron, texte | page) qui déplie sa vue détaillée juste dessous.
- **Deux règles d'état**, communes à tous : survol, ouvert.
- Les types ne se distinguent **que par leur texte** (titre, champs, gris).
- **Natif d'abord** : dépliage par `<details>` / `<summary>` ; la fiche
  n'est rendue qu'au premier dépliage.
- **Par tranches** : la sélection se montre 200 nœuds à la fois, avec leur
  contexte ; la tranche suivante s'ajoute quand la fin de la Liste
  approche.

## Ce que les données imposent

Relevé sur 1807 (22 158 nœuds) :

| Constat | Conséquence pour le composant |
|---|---|
| Emphase `*…*` dans 4 525 nœuds (`Gabillot aîné, *en gros*, …`) | rendue en italique, astérisques retirés |
| 24 empans coupent une emphase | texte découpé aux bornes des empans *et* de l'emphase (`lib/text/segments.ts`) ; le fond d'un champ reste continu à travers ces coupures |
| Empans en points de code, astérisques compris | positions lues dans `text` brut, avant tout retrait de l'emphase |
| 58 nœuds sur plusieurs lignes (groupes à accolade), plusieurs SUBJ / DESC / ADDR | retours à la ligne conservés ; les champs sont une suite ordonnée |
| Entrées courtes (39 caractères en moyenne, 729 au plus) | une ligne le plus souvent ; une entrée longue passe à la ligne, alignée à droite du chevron |
| Hors champ : numéros de page, titres courants, paragraphes (jusqu'à 1 405 caractères) | une ligne, coupée par « … » ; texte entier dans la vue détaillée |
| Sections : 24 caractères en médiane, 29 sur 603 au-delà de 90 ; casse imprimée variable (capitales ou non) | titre d'une ligne, coupé par « … », tout en capitales ; intitulé entier dans la vue détaillée |
| Jusqu'à 7 niveaux d'emboîtement ; plus gros sous-arbre : 13 737 nœuds | guides serrés (environ 11 px par niveau) ; titres fixés et empilés |
| Ancres : une page en général, deux pour 2 nœuds, aucune pour quelques-uns | première page à droite (vide sans ancre) ; « p. 60 », « pp. 60–61 » ou « unknown page » dans la vue détaillée |

## Langue

Interface en anglais (« Page », clés de la fiche) ;
traduction plus tard (`docs/IDEES.md`). Le texte des annuaires reste tel quel
(`lang="fr"`).

## Anatomie

```
                                                               Page    ← en-tête (seul)
┌› MAIRIES DU CANTON DE PARIS.                                   198   ← titre (contexte), fixé
│ ┌› III.E MAIRIE, COMPOSÉE DES DIVISIONS…                       199   ← titre fixé, empilé
│ │ › [M. Rousseau], [maire], [rue des Jeuneurs, 9.]             199   ← ligne d'entrée
│ │ › Mairies du canton de Paris.                                200   ← ligne hors champ (gris)
│ │ ┌› TRIBUNAL DE PAIX.                                         200
│ │ │╭ ⌄ [Juge de paix.] [M. Véron fils], [rue …, 34.]           200 ╮ ← ligne ouverte :
│ │ ││   Text · champs · Type · Source · Identifier · chemin        │   ligne + fiche,
│ │ │╰──────────────────────────────────────────────────────────────╯   une carte en relief
│ │ •                                                                  ← fin du groupe
```

- **Colonnes** : texte (reste de la largeur), page (largeur fixe, tout à
  droite). Largeur fixe pour que l'en-tête et toutes les lignes s'alignent.
- **En-tête** : seulement « Page », en petit et atténué, au-dessus de la
  première ligne ; il n'est pas fixé.

## Groupe (section) et guide de niveau

- Une section, contexte compris, est un **groupe** : sa ligne de titre, puis,
  dans l'ordre du document, ses lignes et ses sous-groupes. Pas de fond, pas
  de cadre, pas d'écart entre deux lignes ni entre deux groupes.
- **Guide** : filet de 2 px à gauche du groupe, de sous sa ligne de titre
  jusqu'à la fin du groupe, terminé par une **boule** (6 px). Guides, coudes
  et boules : gris foncé (`--gray-11`), à tous les niveaux.
- **Coude** : le guide part de la mi-hauteur de la ligne de titre et se coude
  (rayon 0,25 rem) vers son chevron.
- **Retrait** : un sous-groupe est en retrait à gauche seulement, son guide
  sous le chevron du titre parent ; à droite, toutes les lignes rejoignent le
  même bord : la colonne des pages reste alignée à tous les niveaux.
- **Contexte** : les rubriques ancêtres de la sélection sont des groupes
  comme les autres (le plus haut à l'extérieur) ; ils ne contiennent que la
  sélection et ne sont jamais comptés dedans. Résultats d'une recherche :
  chacun sous toutes ses rubriques, chaque rubrique une fois ; nœuds de
  même parent dans l'ordre de lecture.
- **Titre** : la ligne de son propre nœud, avec une seule règle en plus :
  **fixé** en haut de la liste (sous la barre de la vue) tant que le groupe est visible, **empilé** sous
  les titres de ses parents (`top: profondeur × --title-height`). Les titres
  fixés forment un escalier, chaque coude rattaché à son guide. Sa vue
  détaillée, si elle est ouverte, n'est pas fixée : elle défile avec le
  contenu.

## Élément (tout nœud)

`<details>` dont la ligne est le `<summary>` et la vue détaillée le contenu.
La ligne : chevron, texte, puis la page à droite.

| Type | Texte de la ligne |
|---|---|
| Section | intitulé en capitales grasses (`text-transform: uppercase`, quelle que soit la casse imprimée), une ligne, « … » |
| Entrée | texte imprimé, champs sur fond teinté aux coins arrondis, sujet en petites capitales ; passe à la ligne si long |
| Hors champ | texte atténué (gris), une ligne, « … » |

Champs d'une entrée :

| Libellé | Fond | Style |
|---|---|---|
| SUBJ | violet transparent `--violet-a4` | petites capitales |
| DESC | sarcelle transparent `--teal-a4` | normal |
| ADDR | jaune transparent `--yellow-a4` | normal |

Échelles transparentes (alpha) de Radix Themes, choisies sur deux planches :
elles se fondent dans le fond d'une ligne survolée ou ouverte au
lieu d'y poser des pastilles. Le fond déborde de 0,08 em de chaque côté (marge négative) :
coins arrondis visibles, texte non décalé, filet blanc entre deux champs
voisins. Le texte entre les empans n'a pas de fond. Afficher ou masquer la
couleur d'un champ : réglage envisagé plus tard (`docs/IDEES.md`).

**Chevron** : devant le texte de toute ligne (tout élément se déplie), gris
atténué, tourné vers le bas quand l'élément est ouvert. Le texte garde sa
place à droite du chevron, même sur plusieurs lignes.

**Vue détaillée** : la fiche (`components/NodeDetail.tsx`), en DataList de
Radix Themes, trois groupes aux valeurs alignées : Text ; champs (valeur
`normalized`) ; Type, Source, Identifier, plus petits. Puis le chemin des
rubriques en dernier, en texte (pas de liens : seules les facettes changent
la sélection), sur une ligne, intitulés séparés par « › ».
Chaque intitulé est borné (16 rem) et tronqué (« … ») s'il le faut pour
tenir dans la largeur, sauf le dernier, la section la plus proche, toujours
entier. Un peu d'air sous elle (`--space-2`) avant la ligne
suivante ; aucun au-dessus, pour que la ligne cliquée ne bouge pas.

**Fiche au dépliage** : une ligne repliée n'a qu'une case vide ; au premier
dépliage, la fiche y est rendue (lue dans le volume chargé), puis gardée.
Une sélection d'un seul nœud montre sa fiche dépliée d'emblée.

## États

Deux règles, pour tous les éléments :

| État | Rendu |
|---|---|
| Survol | la ligne prend le fond `--gray-2`, sans relief |
| Ouvert | ligne et vue détaillée forment une carte en relief (`--shadow-4`) sur fond `--gray-2` |

Focus clavier : contour visible sur la ligne. La sélection et l'URL ne
changent ni au survol ni au dépliage. Pas de transition.

## Implémentation : ce qui est inévitable

- **Titre fixé dans un `<details>`** : un élément fixé ne sort pas de son
  parent. Le `<details>` est donc rendu transparent (`display: contents`) :
  la ligne se fixe par rapport au groupe. Conséquence : la carte « ouverte »
  se dessine en deux morceaux jointifs (ligne : coins hauts, ombre coupée en
  bas ; vue détaillée : coins bas, ombre coupée en haut, `clip-path`). Même
  règle pour tous les éléments, titres ou non.
- **Coude porté par le titre** : le guide est dessiné par le groupe, le coude
  par la ligne de titre, pour suivre le titre une fois fixé. Un cache, sur la
  ligne de titre, masque le guide qui continue à monter derrière elle.
- **Profondeur** : chaque groupe porte `--depth` (contexte compris), pour la
  pile des titres. Le titre d'un groupe est son premier élément : aucune
  classe à part.
- **Épaisseurs en pixels entiers** : 1,5 px s'affiche tantôt sur 1, tantôt
  sur 2 pixels selon la position ; guides et coudes à 2 px.
- **Tranches** : la Liste reçoit toute la sélection et n'en rend que le
  début, avec son contexte (`withContext`) ; une fin vide, observée à un
  écran près (`IntersectionObserver` sur la zone qui défile), ajoute la
  tranche suivante. Une ligne déjà rendue ne l'est plus (`memo`) ; les
  guides ne dépendent d'aucun `:has()`, qui ferait recalculer le style de
  toute la Liste à chaque tranche.
- **Groupes hors de l'écran** : `content-visibility: auto`, hauteur estimée
  (20 rem) tant qu'un groupe n'a pas été montré ; la barre de défilement
  est donc approchée.
- **Fiches au dépliage** : un seul composant client pour toute la Liste
  (`components/NodeDetails.tsx`) écoute les dépliages (l'événement `toggle`
  ne remonte pas : écouté à la capture) et rend chaque fiche demandée dans sa
  case par un portail ; une demande par fiche, gardée.

## Jetons

Couleurs, espacements, rayons, ombres et tailles de texte sont ceux du thème Radix Themes (`app/layout.tsx` : accent iris, gris
mauve) ; `app/globals.css` ne définit que ce que Radix n'a pas. Contrastes :
texte et texte atténué ≥ 4,5:1 sur blanc, sur `--gray-2` et sur les teintes
des champs.

| Jeton (Radix) | Usage |
|---|---|
| `--gray-12` | texte |
| `--gray-11` | hors champ, page, en-tête, chevron, clés de la fiche ; guides, coudes, boules |
| `--color-background` | page, lignes, cache du coude |
| `--gray-2` | survol, élément ouvert |
| `--shadow-4` | élément ouvert |
| `--radius-4` / `--radius-2` | ligne survolée, élément ouvert / coude du guide |
| `--space-1` à `--space-5` | 4, 8, 12, 16, 24 px |
| `--font-size-2` | page, en-tête, texte petit |
| `--focus-8` | anneau du focus clavier (2 px, à 2 px), comme les composants de Radix |

| Jeton (nôtre) | Valeur | Usage |
|---|---|---|
| `--tint-subj` / `--tint-desc` / `--tint-addr` | `--violet-a4` / `--teal-a4` / `--yellow-a4` | fonds des champs |
| `--title-height` | `1.75rem` | hauteur d'une ligne de titre, pas de la pile |
| `--line-pad` | `0.375rem` | marge intérieure gauche et droite d'une ligne ; retrait d'un sous-groupe |
| `--line-pad-y` | `0.125rem` | marge intérieure haute et basse d'une ligne (Liste et arbre des facettes) |
| `--guide-width` / `--guide-gap` / `--ball` | `2px` / `0.25rem` / `6px` | guide, écart avec les lignes, boule |
| `--icon` | `0.875rem` | chevron |

Écrits sur place (une seule fois) : largeur de la vue (64 rem), colonnes
texte | page (`1fr 2.5rem`), espacement des titres en capitales (0,03 em).

Police : **Fira Sans**, pour toute l'interface (vraies petites capitales,
nettes à l'écran), chargée par `next/font/google` (copiée sur le site au
build, aucune requête à Google). Texte des lignes, titres et valeurs de la
fiche à la même taille ; page, en-tête et clés de la fiche plus petits.


## Accessibilité

- **Structure** : chaque groupe est une `<section>` nommée par sa ligne de
  titre (`aria-labelledby`) ; ses éléments dans l'ordre du document. Guides,
  coudes, boules et chevrons sont décoratifs (pseudo-éléments, `aria-hidden`).
- **Dépliage** : `<details>` / `<summary>` natifs (rôle, état, clavier,
  Ctrl+F qui ouvre l'élément trouvé). `display: contents` sur `<details>` ne
  masque ni le `summary` ni son état (arbre d'accessibilité de Chromium). Le
  `summary` est nommé par son texte seul (`aria-labelledby`), sans le
  numéro de page.
- **Titres en capitales** : Chromium transmet l'intitulé en capitales ;
  certains lecteurs d'écran épellent les mots courts en capitales. À tester.
- **Titres** : un `summary` ne peut pas contenir de vrai titre (aplati par
  les lecteurs d'écran) ; la navigation se fait par régions (`<section>`
  nommées).
- **Hors champ** : mention « Out of scope » masquée à l'écran, lue avant le
  texte (la couleur n'est pas seule).
- **Champs** : le fond n'est qu'une aide à l'œil ; les libellés sont écrits
  dans la vue détaillée.
- **Vue détaillée dans la liste** : pas de `<h1>` par élément (un seul par
  page).

## À faire / à éviter

| À faire | À éviter |
|---|---|
| garder le texte de numrev tel quel | corriger, réordonner ou compléter le texte |
| marquer les champs par un fond, le sujet en petites capitales | souligner, encadrer, écrire un nom dans le texte |
| structurer par les guides, le retrait et les titres fixés | cartes de section, filets de séparation, zébrage, bandeaux |
| même élément et mêmes règles pour tous les types | variante ou cas particulier par type |
| éléments natifs (`<details>`) | script là où le navigateur suffit |
| changer la sélection par les facettes | liens dans la Liste qui changent la sélection |
| épaisseurs en pixels entiers | épaisseurs fractionnaires (rendu inégal) |

## Essais écartés

- Cartes de section emboîtées : lourdes dès quelques niveaux, et peu claires
  sur l'endroit où l'on est. Intitulé écrit le long du guide ; titre en
  « marque-page » coloré.
- Filets et lignes de séparation, zébrage, bandeaux sous les titres ; écart
  entre les lignes (gêne la sélection) ; relief au survol.
- Lien vers sa propre page (« Open ») sur chaque ligne et fil d'Ariane
  cliquable : une seconde navigation qui doublait les facettes.
- Champs soulignés, ou texte des champs en couleur ; table à colonnes
  Subject / Description / Address ; sujet en gras ; pastels néon, puis
  teintes Radix opaques ; sujet et description en cyan et sarcelle (trop
  proches).
- Titres en petites capitales ; autres polices (Noto Sans, Source Sans 3,
  IBM Plex Sans, Alegreya, EB Garamond…).
- Fiche en pleine page à part ; fiche rendue d'avance pour chaque ligne
  (moitié du poids de la page).

## Questions ouvertes

- **Lecteur d'écran réel** : titres en capitales.
