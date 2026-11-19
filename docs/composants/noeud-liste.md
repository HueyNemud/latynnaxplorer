# Composant : nœud dans la vue Liste

Fiche de composant. Elle décline la représentation d'un nœud dans la vue Liste
(`docs/DESIGN.md`, « Représentation d'un nœud ») et la façon dont la vue les
compose. Densité détaillée (la fiche) : sprint 4. Densité compacte et
composition : maquette du sprint 5, reprise au sprint 6 (liste à plat, guides
de niveau). Essais écartés en fin de fiche.

## Problème

Montrer une sélection de nœuds tels que l'annuaire les imprime, champs
repérables d'un coup d'œil, dans leur hiérarchie de rubriques, sans que la
structure ne prenne le pas sur le contenu des entrées ; savoir à tout moment
où l'on est dans cette hiérarchie ; inspecter n'importe quel nœud sur place ;
ouvrir un nœud comme nouvelle sélection.

## Principe : une liste à plat, peu de règles

- **Une liste à plat** : pas de cadre autour des rubriques. La hiérarchie se
  lit par des **guides de niveau** (*indent guides*) : un filet vertical à
  gauche de chaque rubrique, coudé vers son titre, terminé par une boule.
- **Un seul élément** pour tout nœud, quel que soit son type : une ligne
  (chevron, texte, lien | page) qui déplie sa vue détaillée juste dessous.
- **Deux règles d'état**, communes à tous : survol, ouvert.
- Les types ne se distinguent **que par leur texte** (titre, champs, gris).
- **Natif d'abord** : dépliage par `<details>` / `<summary>`, sans
  JavaScript.

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

Interface en anglais (« Page », infobulle du lien, clés de la fiche) ;
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
│ │ │╭ ⌄ [Juge de paix.] [M. Véron fils], [rue …, 34.] ↗         200 ╮ ← ligne ouverte :
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
  jusqu'à la fin du groupe, terminé par une **boule** (6 px). Une seule
  teinte pour tous les niveaux, en deux intensités : à hauteur de chaque
  ligne, seul le guide de sa section est gris foncé (`--color-guide`) ; ceux
  des sections englobantes sont estompés (`--color-guide-faded`) le long de
  leurs sous-groupes. Coude et boule suivent la même règle : estompés s'ils ne
  touchent qu'un sous-groupe (section qui ne contient que des sections, fin
  de groupe sur un sous-groupe).
- **Coude** : le guide part de la mi-hauteur de la ligne de titre et se coude
  (rayon 0,25 rem) vers son chevron.
- **Retrait** : un sous-groupe est en retrait à gauche seulement, son guide
  sous le chevron du titre parent ; à droite, toutes les lignes rejoignent le
  même bord : la colonne des pages reste alignée à tous les niveaux.
- **Contexte** : les rubriques ancêtres de la sélection sont des groupes
  comme les autres (le plus haut à l'extérieur) ; ils ne contiennent que la
  sélection et ne sont jamais comptés dedans.
- **Titre** : la ligne de son propre nœud, avec une seule règle en plus :
  **fixé** en haut de l'écran tant que le groupe est visible, **empilé** sous
  les titres de ses parents (`top: profondeur × --title-height`). Les titres
  fixés forment un escalier, chaque coude rattaché à son guide. Sa vue
  détaillée, si elle est ouverte, n'est pas fixée : elle défile avec le
  contenu.

## Élément (tout nœud)

`<details>` dont la ligne est le `<summary>` et la vue détaillée le contenu.
La ligne : chevron, texte, lien vers sa propre page, puis la page à droite.

| Type | Texte de la ligne |
|---|---|
| Section | intitulé en capitales grasses (`text-transform: uppercase`, quelle que soit la casse imprimée), une ligne, « … » |
| Entrée | texte imprimé, champs sur fond pastel aux coins arrondis, sujet en petites capitales ; passe à la ligne si long |
| Hors champ | texte atténué (gris), une ligne, « … » |

Champs d'une entrée :

| Libellé | Fond | Style |
|---|---|---|
| SUBJ | bleu pastel `#b9e6ff` | petites capitales |
| DESC | menthe pastel `#afffe2` | normal |
| ADDR | jaune pastel `#fffca9` | normal |

Palette néon de colorhunt.co (`#63c8ff`, `#4dffbe`, `#fff83f`) adoucie à 45 %
dans du blanc. Le fond déborde de 0,08 em de chaque côté (marge négative) :
coins arrondis visibles, texte non décalé, filet blanc entre deux champs
voisins. Le texte entre les empans n'a pas de fond. Afficher ou masquer la
couleur d'un champ : réglage envisagé plus tard (`docs/IDEES.md`).

**Chevron** : devant le texte de toute ligne (tout élément se déplie), gris
atténué, tourné vers le bas quand l'élément est ouvert. Le texte garde sa
place à droite du chevron, même sur plusieurs lignes.

**Lien vers sa propre page** : icône (carré et flèche, ↗) juste après le
texte, lien vers `?subtree=<uuid>`, nouvelle sélection : une section montre sa
liste, un autre nœud est montré seul, déplié, dans son contexte. Infobulle et
nom accessible « Open on its own page ». Visible seulement au survol de
l'élément, quand il est ouvert, ou au focus clavier (masqué par `opacity`,
pour rester atteignable au clavier) ; fond foncé au survol. Pour un titre ou
un hors champ trop long, la coupure « … » porte sur l'intitulé seul : l'icône
reste visible.

**Vue détaillée** : la fiche du sprint 4 (`components/NodeDetail.tsx`) :
Text, champs (valeur `normalized`), Type, Source, Identifier, puis le chemin
des rubriques en dernier, sur une ligne, intitulés séparés par « › ».
Chaque intitulé est borné (16 rem) et tronqué (« … ») s'il le faut pour
tenir dans la largeur, sauf le dernier, la section la plus proche, toujours
entier. Un peu d'air sous elle (`--space-2`) avant la ligne
suivante ; aucun au-dessus, pour que la ligne cliquée ne bouge pas.

## États

Deux règles, pour tous les éléments :

| État | Rendu |
|---|---|
| Survol | la ligne prend le fond `--color-open`, sans relief |
| Ouvert | ligne et vue détaillée forment une carte en relief (`--shadow-raised`) sur fond `--color-open` |

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
- **Guide estompé par le sous-groupe** : un sous-groupe commence au guide de
  son parent (marge négative, contenu inchangé) et le recouvre de sa bordure
  gauche, estompée ; coude et boule estompés par `:has()`.
- **Profondeur** : chaque groupe porte `--depth` (contexte compris), pour la
  pile des titres. Le titre d'un groupe est son premier élément : aucune
  classe à part.
- **Épaisseurs en pixels entiers** : 1,5 px s'affiche tantôt sur 1, tantôt
  sur 2 pixels selon la position ; guides et coudes à 2 px.
- **Lien dans le fil du texte**, pas en flexbox : Firefox sous-estime la
  largeur d'un texte dont les champs ont des marges négatives, et le passe à
  la ligne trop tôt.

## Jetons

Dans `app/globals.css`. Contrastes : texte et texte atténué ≥ 4,5:1 sur blanc,
sur `--color-open` et sur les fonds pastel.

| Jeton | Valeur | Usage |
|---|---|---|
| `--color-text` | `#1f2328` | texte |
| `--color-muted` | `#59636e` | hors champ, page, en-tête, chevron, lien, clés de la fiche |
| `--color-background` | `#ffffff` | page, lignes, cache du coude |
| `--color-open` | `#f6f8fa` | survol, élément ouvert (gris bleuté) |
| `--color-guide` | `#3d434a` | guide de la section la plus proche, coude, boule |
| `--color-guide-faded` | `#c9ced4` | guides des sections englobantes, le long de leurs sous-groupes |
| `--tint-subj` / `--tint-desc` / `--tint-addr` | `#b9e6ff` / `#afffe2` / `#fffca9` | fonds des champs |
| `--shadow-raised` | contour 1 px à 14 % + ombre 4 px / 14 px à 14 % | élément ouvert |
| `--radius-card` | `0.5rem` | ligne survolée, élément ouvert |
| `--title-height` | `1.75rem` | hauteur d'une ligne de titre, pas de la pile |
| `--line-pad` | `0.375rem` | marge intérieure gauche et droite d'une ligne ; retrait d'un sous-groupe |
| `--guide-width` / `--guide-gap` / `--ball` | `2px` / `0.25rem` / `6px` | guide, écart avec les lignes, boule |
| `--icon` | `0.875rem` | chevron et icône du lien |
| `--columns` | `1fr 2.5rem` | texte, page |

Police : **Fira Sans**, pour toute l'interface (vraies petites capitales,
nettes à l'écran), chargée par `next/font/google` (copiée sur le site au
build, aucune requête à Google). Texte des lignes, titres et valeurs de la
fiche à la même taille ; page, en-tête et clés de la fiche plus petits.
Disparaissent au sprint 6 : cartes de section et `--shadow-rest`, colonne et
pastille Open, `--row-gap`, gras du sujet.

## Accessibilité

- **Structure** : chaque groupe est une `<section>` nommée par sa ligne de
  titre (`aria-labelledby`) ; ses éléments dans l'ordre du document. Guides,
  coudes, boules et chevrons sont décoratifs (pseudo-éléments, `aria-hidden`).
- **Dépliage** : `<details>` / `<summary>` natifs (rôle, état, clavier,
  Ctrl+F qui ouvre l'élément trouvé). `display: contents` sur `<details>` ne
  masque ni le `summary` ni son état (arbre d'accessibilité de Chromium). Le
  `summary` est nommé par son texte seul (`aria-labelledby`), sans le lien ni
  le numéro de page.
- **Lien dans le `summary`** : élément interactif dans un autre, mal annoncé
  par certains lecteurs d'écran ; accepté pour la simplicité, à tester. Son
  nom est court (« Open on its own page ») et il est décrit par le texte de
  sa ligne (`aria-describedby`), pour ne pas donner des dizaines de liens
  identiques.
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
| épaisseurs en pixels entiers | épaisseurs fractionnaires (rendu inégal) |

## Essais écartés

Sprint 6 :

- Cartes de section emboîtées (sprint 5) : lourdes dès quelques niveaux, et
  peu claires sur l'endroit où l'on est.
- Intitulé de la rubrique écrit le long de son guide (seul ou avec les
  titres fixés) : il faut pencher la tête, intitulés coupés, 2 rem de large
  par niveau.
- Titre en « marque-page » de la couleur du guide (bande sur toute la ligne,
  ou languette derrière l'intitulé) : lourd.
- Guides bleu-lavande `#8e9be6`, puis gris moyen `#8c959f` ; guides de 1 et
  1,5 px (fins, puis inégaux) ; coude au rayon de 0,5 rem.
- Écart entre les lignes : gêne la sélection et le survol ; marge au-dessus
  d'un élément ouvert : la ligne cliquée saute.
- Relief au survol (remplacé par le seul fond) ; grège `#f6f6f4` (jaunâtre)
  et grège éclairci `#fafaf8` (survol invisible).
- Bouton « Open » à droite de la ligne : loin du texte, sens obscur. Puis
  « Show only this » en haut de la fiche, et « Open on its own page » en
  bouton pleine largeur sous la fiche.
- Titres en petites capitales (hauteurs inégales selon la casse imprimée) ;
  toutes petites capitales (`all-small-caps`).
- Sujet en gras : rivalise avec les titres. Champs sans fond, ou sujet seul
  surligné ; fonds pâlis à 30 % et 20 %.
- Polices : Noto Sans (système, petites capitales fabriquées et grêles),
  Source Sans 3, Alegreya Sans, IBM Plex Sans, Source Serif 4,
  EB Garamond, Alegreya.

Sprint 5 :

- Texte souligné de la couleur du champ, nom sous le trait (avec ou sans
  légende) ; texte des champs en couleur ; surligneur sur la moitié basse.
- Table à colonnes Subject / Description / Address ; à plat avec une colonne
  Section.
- Filets et lignes de séparation horizontaux ; bandeaux gris sous les
  titres ; feuille unique sur fond teinté.
- Fil d'Ariane et décompte des nœuds au-dessus de la liste (le contexte
  prend la forme de la liste).
- Halo bleu au survol.
- Titre ouvert qui se replie seul en atteignant le haut (sauts) ; titre
  ouvert non fixé.
- Bouton et script à la place de `<details>`.
- « Open » toujours visible ; en-tête « Text ».

## Questions ouvertes

- **Poids de la page** : chaque vue détaillée est dans le HTML (repliée).
  Mesuré au sprint 5 : 66 Mo pour 13 736 nœuds, dont 46 Mo de charge RSC ;
  accepté pour l'instant, la pagination est la vraie réponse
  (`docs/IDEES.md`).
- **Lecteur d'écran réel** : lien dans le `summary`, titres en capitales.
