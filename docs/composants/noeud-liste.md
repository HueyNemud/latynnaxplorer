# Composant : nœud dans la vue Liste

La vue Liste (`components/NodeList.tsx`) et la représentation d'un nœud
qu'elle compose : sa ligne et sa fiche (`docs/DESIGN.md`, « Représentation
d'un nœud »). Jetons et fiche de Radix Themes.

## Principe

- **À plat** : pas de cadre autour des rubriques ; on suit les niveaux
  grâce aux **guides** (un filet à gauche de chaque rubrique, coudé vers sa
  ligne, terminé par une boule) et aux **intitulés fixés** en haut de la
  Liste.
- **Un seul élément** pour tout nœud : une ligne (chevron, texte | page)
  qui déplie sa fiche juste dessous (`<details>` natif) ; deux états,
  survol et ouvert ; les types ne se distinguent que par leur texte.
- **Par tranches** de 200 nœuds, avec leur contexte : la suivante s'ajoute
  quand la fin de la Liste approche ; une autre sélection repart de la
  première. Ni décompte ni URL changée ; Ctrl+F ne trouve que les lignes
  montrées (la recherche couvre le reste).
- **Vue vide** : un grand aplat gris, « Nothing to show » sans critère,
  « No match » sinon.

## Ce que les données imposent

Relevé sur 1807 (22 158 nœuds) :

| Constat | Conséquence |
|---|---|
| Emphase `*…*` dans 4 525 nœuds | rendue en italique, astérisques retirés |
| 24 empans coupent une emphase | texte découpé aux bornes des empans, de l'emphase et des correspondances (`lib/text/segments.ts`) ; un empan reste un seul élément, son fond continu |
| Empans en points de code, astérisques compris | positions lues dans le texte brut, avant de retirer l'emphase |
| 58 groupes à accolade, sur plusieurs lignes | retours à la ligne gardés ; plusieurs empans de même libellé |
| Entrées de 39 caractères en moyenne, 729 au plus | une ligne le plus souvent ; une entrée longue passe à la ligne, alignée après le chevron |
| Hors champ : jusqu'à 1 405 caractères | une ligne, coupée par « … » ; texte entier dans la fiche |
| Intitulés : 29 sur 603 au-delà de 90 caractères ; casse variable | une ligne, coupée par « … », en capitales ; entier dans la fiche |
| 7 niveaux ; plus gros sous-arbre : 13 737 nœuds | guides serrés (environ 11 px par niveau) ; intitulés fixés et empilés |
| Une page en général, deux pour 2 nœuds, aucune pour quelques-uns | première page à droite ; « p. 60 », « pp. 60–61 » ou « unknown page » dans la fiche |

## Anatomie

```
                                                               Page    ← en-tête des colonnes
┌› MAIRIES DU CANTON DE PARIS.                                   198   ← rubrique (contexte), intitulé fixé
│ ┌› III.E MAIRIE, COMPOSÉE DES DIVISIONS…                       199   ← sous-rubrique, intitulé empilé
│ │ › [M. Rousseau], [maire], [rue des Jeuneurs, 9.]             199   ← entrée
│ │ › Mairies du canton de Paris.                                200   ← élément hors champ (gris)
│ │ ┌› TRIBUNAL DE PAIX.                                         200
│ │ │╭ ⌄ [Juge de paix.] [M. Véron fils], [rue …, 34.]           200 ╮ ← nœud ouvert :
│ │ ││   Text · empans · Type · Source · Identifier · chemin        │   ligne + fiche,
│ │ │╰──────────────────────────────────────────────────────────────╯   en relief
│ │ •                                                                  ← fin de la rubrique
```

- **Colonnes** : texte, puis page (largeur fixe, à droite), pour que
  l'en-tête et toutes les lignes s'alignent. L'en-tête ne porte que
  « Page », en petit et atténué, et ne reste pas fixé.

## Rubrique et guide

- Une rubrique, contexte compris : sa ligne, puis, dans l'ordre de
  lecture, ses nœuds et ses sous-rubriques. Ni fond, ni cadre, ni écart.
- **Guide** : filet de 2 px, de sous la ligne de la rubrique jusqu'à sa
  fin, terminé par une **boule** de 6 px ; gris foncé (`--gray-11`) à tous
  les niveaux. Il part de la mi-hauteur de la ligne et se coude (rayon
  0,25 rem) vers son chevron.
- **Retrait** : une sous-rubrique est en retrait à gauche seulement, son
  guide sous le chevron de la rubrique parente ; la colonne des pages reste
  alignée à tous les niveaux.
- **Contexte** : les rubriques ancêtres hors de la sélection sont montrées
  comme les autres, et ne contiennent que la sélection. Résultats d'une
  recherche : chacun sous toutes ses rubriques, chaque rubrique une fois.
- **Intitulé fixé** : la ligne d'une rubrique reste en haut de la Liste
  tant que la rubrique est visible, empilée sous celles de ses parentes
  (`top: profondeur × --heading-height`), son coude rattaché à son guide.
  Sa fiche, si elle est ouverte, défile avec le reste.

## Nœud

| Type | Texte de la ligne |
|---|---|
| Rubrique | intitulé en capitales grasses, quelle que soit la casse imprimée ; une ligne, « … » |
| Entrée | texte imprimé, empans sur fond coloré, sujet en petites capitales ; passe à la ligne si long |
| Élément hors champ | texte gris (`--gray-11`), une ligne, « … » |

| Libellé | Fond | Style |
|---|---|---|
| SUBJ | violet transparent `--violet-a4` | petites capitales |
| DESC | sarcelle transparent `--teal-a4` | normal |
| ADDR | jaune transparent `--yellow-a3` | normal |

Couleurs transparentes de Radix : elles se fondent dans le fond d'une ligne
survolée ou ouverte. Le fond déborde de 0,08 em de chaque côté (coins
arrondis visibles, texte non décalé, filet blanc entre deux empans
voisins) ; le texte hors empan n'a pas de fond.

**Correspondances** du texte cherché (`lib/text/matches.ts`) : les mêmes
que celles qui sélectionnent, texte plié et zones fouillées, ramenées aux
positions du texte brut ; dans toute ligne, contexte compris. Chacune est
un `<mark>` sur fond `--iris-6` : opaque, il recouvre le fond de l'empan et
se lit pareil sur tous ; texte `--gray-12`, même hors champ.

**Chevron** : devant toute ligne (tout nœud se déplie), gris, tourné vers
le bas quand le nœud est ouvert ; le texte garde sa place après lui, même
sur plusieurs lignes.

**Fiche** (`components/NodeDetail.tsx`) : DataList de Radix en trois
listes aux valeurs alignées : Text ; un empan par ligne (valeur
`normalized`) ; Type, Source, Identifier, plus petits. Puis le chemin, en
texte (pas de liens), sur une ligne, intitulés séparés par « › », chacun
borné à 16 rem et coupé par « … », sauf celui de la rubrique la plus
proche. Un peu d'air dessous, aucun au-dessus (la ligne cliquée ne bouge
pas). Rendue au premier dépliage, puis gardée ; une sélection d'un seul
nœud la montre dépliée d'emblée.

## États

| État | Rendu |
|---|---|
| Survol | la ligne prend le fond `--gray-2` |
| Ouvert | ligne et fiche forment une carte en relief (`--shadow-4`) sur fond `--gray-2` |

Focus clavier : contour sur la ligne. Ni la sélection ni l'URL ne changent
au survol ou au dépliage. Pas de transition.

## Implémentation : ce qui est inévitable

- **Ligne fixée dans un `<details>`** : un élément fixé ne sort pas de son
  parent ; le `<details>` est donc sans boîte (`display: contents`) et la
  ligne se fixe par rapport à la rubrique. Le nœud ouvert se dessine alors
  en deux morceaux jointifs (ligne et fiche, chacun coupant son ombre du
  côté de l'autre, `clip-path`).
- **Coude porté par la ligne** de la rubrique, pour la suivre une fois
  fixée ; un cache masque le guide qui monte derrière elle.
- **Profondeur** : chaque rubrique porte `--depth` (contexte compris).
- **Épaisseurs en pixels entiers** : 1,5 px s'affiche tantôt sur 1, tantôt
  sur 2 pixels.
- **Tranches** : la Liste reçoit toute la sélection et n'en rend que le
  début, avec son contexte (`withContext`) ; une fin vide, observée à un
  écran près (`IntersectionObserver`), ajoute la tranche suivante. Une
  ligne rendue ne l'est plus (`memo`) ; aucun `:has()` dans les règles de
  la Liste, qui ferait recalculer le style de toute la page à chaque
  tranche.
- **Rubriques hors de l'écran** : `content-visibility: auto`, hauteur
  estimée (20 rem) tant qu'elles n'ont pas été montrées ; la barre de
  défilement est donc approchée.
- **Fiches au dépliage** : un seul composant pour toute la Liste
  (`components/NodeDetails.tsx`) écoute les dépliages (l'événement `toggle`
  ne remonte pas : écouté à la capture) et rend chaque fiche dans sa case
  par un portail.

## Jetons

Ceux du thème Radix (accent iris, gris mauve) ; `app/globals.css` ne
définit que ce que Radix n'a pas. Texte et texte atténué ≥ 4,5:1 sur
blanc, sur `--gray-2` et sur les fonds des empans.

| Jeton | Valeur | Usage |
|---|---|---|
| `--tint-subj` / `--tint-desc` / `--tint-addr` | `--violet-a4` / `--teal-a4` / `--yellow-a3` | fonds des empans |
| `--heading-height` | `1.75rem` | hauteur de la ligne d'une rubrique, pas de la pile |
| `--line-pad` / `--line-pad-y` | `0.375rem` / `0.125rem` | marges intérieures d'une ligne (Liste et Contents) ; retrait d'une sous-rubrique |
| `--guide-width` / `--guide-gap` / `--ball` | `2px` / `0.25rem` / `6px` | guide, écart avec les lignes, boule |
| `--icon` | `0.875rem` | chevron |

Police **Fira Sans** pour toute l'interface (vraies petites capitales),
chargée par `next/font` et servie avec le site. Lignes, intitulés et
valeurs de la fiche à la même taille ; page, en-tête et clés de la fiche
plus petits.

## Accessibilité

- Chaque rubrique est une `<section>` nommée par sa ligne
  (`aria-labelledby`) ; on navigue par régions, un `summary` ne pouvant
  contenir de vrai titre. Guides, coudes, boules et chevrons sont
  décoratifs.
- `<details>` / `<summary>` natifs : rôle, état, clavier, Ctrl+F qui ouvre
  le nœud trouvé ; `display: contents` ne masque ni le `summary` ni son
  état. Le `summary` est nommé par son texte seul, sans la page.
- Un élément hors champ est précédé de « Out of scope », masqué à l'écran.
- Les fonds des empans ne sont qu'une aide à l'œil : les libellés sont
  écrits dans la fiche.

## À faire / à éviter

| À faire | À éviter |
|---|---|
| garder le texte de numrev tel quel | corriger, réordonner ou compléter le texte |
| marquer les empans par un fond, le sujet en petites capitales | souligner, encadrer, écrire un nom dans le texte |
| structurer par les guides, le retrait et les intitulés fixés | cadres de rubrique, filets de séparation, zébrage, bandeaux |
| même élément et mêmes règles pour tous les types | variante ou cas particulier par type |
| éléments natifs (`<details>`) | script là où le navigateur suffit |
| épaisseurs en pixels entiers | épaisseurs fractionnaires |

## Essais écartés

- Cartes de rubrique emboîtées (lourdes, peu claires sur l'endroit où l'on
  est) ; intitulé écrit le long du guide ; « marque-page » coloré.
- Filets de séparation, zébrage, bandeaux ; écart entre les lignes (gêne
  la sélection du texte) ; relief au survol.
- Lien « Open » sur chaque ligne et chemin cliquable : une seconde
  navigation qui doublait les facettes.
- Empans soulignés ou en couleur ; table Subject / Description / Address ;
  sujet en gras ; couleurs néon, puis opaques ; sujet et description trop
  proches (cyan, sarcelle).
- Correspondances en gras (peu lisible, invisible sur les intitulés), en
  texte iris (trop discret), sur un iris transparent (sa teinte change
  avec l'empan : kaki sur le jaune).
- Intitulés en petites capitales ; autres polices (Noto Sans, Source
  Sans 3, IBM Plex Sans, Alegreya, EB Garamond…).
- Fiche en page à part ; fiche rendue d'avance pour chaque ligne.

## Questions ouvertes

- **Lecteur d'écran réel** : certains épellent les mots courts en
  capitales (intitulés).
