# Composant : nœud dans la vue Liste

Fiche de composant. Elle décline la représentation d'un nœud dans la vue Liste
(`docs/DESIGN.md`, « Représentation d'un nœud ») et la façon dont la vue les
compose. Densité détaillée (la fiche) : sprint 4. Densité compacte et
composition : maquette validée au sprint 5 (essais écartés en fin de fiche).

## Problème

Montrer une sélection de nœuds tels que l'annuaire les imprime, champs
repérables d'un coup d'œil, dans leur hiérarchie de rubriques, sans que la
structure ne prenne le pas sur le contenu des entrées ; inspecter n'importe
quel nœud sur place ; ouvrir un nœud comme nouvelle sélection.

## Principe : un seul élément, peu de règles

- **Un seul élément** pour tout nœud, quel que soit son type : une ligne
  (texte | Open | page) qui déplie sa vue détaillée juste dessous.
- **Une seule carte** pour toute section, contexte compris.
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
| Entrées courtes (39 caractères en moyenne, 729 au plus) | une ligne le plus souvent ; une entrée longue passe à la ligne |
| Hors champ : numéros de page, titres courants, paragraphes (jusqu'à 1 405 caractères) | une ligne, coupée par « … » ; texte entier dans la vue détaillée |
| Sections : 24 caractères en médiane, 29 sur 603 au-delà de 90 | titre d'une ligne, coupé par « … » ; intitulé entier dans la vue détaillée |
| Jusqu'à 7 niveaux d'emboîtement ; plus gros sous-arbre : 13 737 nœuds | cartes à faible retrait ; titres fixés et empilés |
| Ancres : une page en général, deux pour 2 nœuds, aucune pour quelques-uns | première page à droite (vide sans ancre) ; « p. 60 », « pp. 60–61 » ou « unknown page » dans la vue détaillée |

## Langue

Interface en anglais (« Open », « Page », clés de la fiche) ; traduction plus
tard (`docs/IDEES.md`). Le texte des annuaires reste tel quel (`lang="fr"`).

## Anatomie

```
                                                               Page    ← en-tête (seul)
┌ MAIRIES DU CANTON DE PARIS.                                    198   ← carte (contexte)
│ ┌ III.E MAIRIE, COMPOSÉE DES DIVISIONS…                        199   ← carte, titre fixé
│ │ [MM. Rousseau (J.-J.)], [maire], [rue des Jeuneurs, 9.]      199   ← ligne d'entrée
│ │ Mairies du canton de Paris.                                  200   ← ligne hors champ (gris)
│ │ ┌ TRIBUNAL DE PAIX.                                          200
│ │ │╭ [Juge de paix.] [M. Véron fils], [rue …, 34.]   (Open)    200 ╮ ← ligne ouverte :
│ │ ││  chemin · Text · champs · Type · Source · Identifier          │   ligne + fiche,
│ │ │╰──────────────────────────────────────────────────────────────╯   une carte grège
```

- **Colonnes** : texte (reste de la largeur), Open (largeur fixe), page
  (largeur fixe, tout à droite). Largeurs fixes pour que l'en-tête et toutes
  les lignes s'alignent.
- **En-tête** : seulement « Page », en petit et atténué, au-dessus de la
  première carte ; il n'est pas fixé.

## Carte (section)

- Fond blanc, coins arrondis, léger relief au repos (`--shadow-rest`).
- Contient, dans l'ordre du document, ses lignes et ses sous-cartes.
- Une sous-carte est en retrait **à gauche seulement** ; à droite, elle
  rejoint le bord de sa carte parente : les colonnes de droite restent
  alignées à tous les niveaux.
- **Contexte** : les rubriques ancêtres de la sélection sont des cartes comme
  les autres (la plus haute à l'extérieur) ; elles ne contiennent que la
  sélection et ne sont jamais comptées dedans.
- Son titre est la ligne de son propre nœud (section suivante), avec une
  seule règle en plus : **fixé** en haut de l'écran tant que la carte est
  visible, **empilé** sous les titres de ses parents
  (`top: profondeur × --title-height`). Sa vue détaillée, si elle est
  ouverte, n'est pas fixée : elle défile avec le contenu.

## Élément (tout nœud)

`<details>` dont la ligne est le `<summary>` et la vue détaillée le contenu.

| Type | Texte de la ligne |
|---|---|
| Section | intitulé en petites capitales grasses, une ligne, « … » |
| Entrée | texte imprimé, champs sur fond pastel aux coins arrondis, sujet en gras ; passe à la ligne si long |
| Hors champ | texte atténué (gris), une ligne, « … » |

Champs d'une entrée :

| Libellé | Fond | Graisse |
|---|---|---|
| SUBJ | bleu pastel `#b9e6ff` | gras |
| DESC | menthe pastel `#afffe2` | normale |
| ADDR | jaune pastel `#fffca9` | normale |

Palette néon de colorhunt.co (`#63c8ff`, `#4dffbe`, `#fff83f`) adoucie à 45 %
dans du blanc. Le fond déborde de 0,08 em de chaque côté (marge négative) :
coins arrondis visibles, texte non décalé, filet blanc entre deux champs
voisins. Le texte entre les empans n'a pas de fond.

**Vue détaillée** : la fiche du sprint 4 (`components/NodeDetail.tsx`),
telle quelle : chemin des rubriques, Text, champs (valeur `normalized`),
Type, Source, Identifier.

**Open** : lien vers `?subtree=<uuid>`, nouvelle sélection. Une section ouvre
sa liste ; un autre nœud est montré seul, déplié, dans ses cartes de contexte
(une sélection d'un seul nœud est une sélection comme les autres). Pastille (fond blanc, contour léger,
inversée au survol), zone de clic généreuse pour ne pas déplier par erreur.
Visible seulement au survol de l'élément, quand il est ouvert, ou au focus
clavier (masqué par `opacity`, pas par `visibility`, pour rester atteignable
au clavier) ; sa colonne garde sa place.

## États

Deux règles, pour tous les éléments :

| État | Rendu |
|---|---|
| Survol | l'élément se soulève (`--shadow-raised`), avec la carte la plus intérieure qui le contient ; les cartes au-dessus ne bougent pas |
| Ouvert | ligne et vue détaillée forment une carte en relief (`--shadow-raised`) sur fond grège (`--color-open`) |

Focus clavier : contour visible sur la ligne. La sélection et l'URL ne
changent ni au survol ni au dépliage. Pas de couleur dans les états.

## Implémentation : ce qui est inévitable

- **Titre fixé dans un `<details>`** : un élément fixé ne sort pas de son
  parent. Le `<details>` est donc rendu transparent (`display: contents`) :
  la ligne se fixe par rapport à la carte. Conséquence : la carte « ouverte »
  se dessine en deux morceaux jointifs (ligne : coins hauts, ombre coupée en
  bas ; vue détaillée : coins bas, ombre coupée en haut, `clip-path`). Même
  règle pour tous les éléments, titres ou non.
- **Profondeur** : chaque carte porte `--depth` (contexte compris), pour la
  pile des titres. Le titre d'une carte est son premier élément : aucune
  classe à part.

## Jetons

Dans `app/globals.css`. Contrastes : texte et texte atténué ≥ 4,5:1 sur blanc
et sur les fonds pastel.

| Jeton | Valeur | Usage |
|---|---|---|
| `--color-text` | `#1f2328` | texte |
| `--color-muted` | `#59636e` | hors champ, page, en-tête, clés de la fiche |
| `--color-background` | `#ffffff` | page, cartes, lignes, pastille Open |
| `--color-open` | `#f6f6f4` | élément ouvert |
| `--tint-subj` / `--tint-desc` / `--tint-addr` | `#b9e6ff` / `#afffe2` / `#fffca9` | fonds des champs |
| `--shadow-rest` | contour 1 px à 8 % + ombre 1 px / 4 px à 10 % | carte au repos |
| `--shadow-raised` | contour 1 px à 14 % + ombre 4 px / 14 px à 14 % | survol, ouvert |
| `--radius-card` | `0.5rem` | cartes, éléments |
| `--title-height` | `1.875rem` | hauteur d'une ligne de titre, pas de la pile |
| `--row-gap` | `0.375rem` | écart entre lignes |
| `--columns` | `1fr 4.5rem 2.5rem` | texte, Open, page |

Une seule police, sans empattements ; texte des lignes, titres et valeurs de
la fiche à la même taille ; page, en-tête, Open et clés de la fiche plus
petits. Disparaissent : soulignement et noms sous le trait (`--color-subj`…,
`--underline-*`, `.badge` de `PrintedText`), contour de focus bleu.

## Accessibilité

- **Structure** : chaque carte est une `<section>` nommée par sa ligne de
  titre (`aria-labelledby`) ; ses éléments dans l'ordre du document.
- **Dépliage** : `<details>` / `<summary>` natifs (rôle, état, clavier,
  Ctrl+F qui ouvre l'élément trouvé). À vérifier dans l'arbre
  d'accessibilité : `display: contents` sur `<details>` ne doit pas masquer le
  `summary` aux lecteurs d'écran.
- **Titres** : un `summary` ne peut pas contenir de vrai titre (aplati par
  les lecteurs d'écran) ; la navigation se fait par régions (`<section>`
  nommées).
- **Open dans le `summary`** : élément interactif dans un autre, mal annoncé
  par certains lecteurs d'écran ; accepté pour la simplicité, à tester.
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
| marquer les champs par un fond, le sujet en gras | souligner, encadrer, écrire un nom dans le texte |
| structurer par les cartes, le retrait et l'espace | filets, zébrage, bandeaux |
| même élément et mêmes règles pour tous les types | variante ou cas particulier par type |
| éléments natifs (`<details>`) | script là où le navigateur suffit |

## Essais écartés (sprint 5)

- Texte souligné de la couleur du champ, nom sous le trait (avec ou sans
  légende) ; texte des champs en couleur ; surligneur sur la moitié basse.
- Table à colonnes Subject / Description / Address ; à plat avec une colonne
  Section.
- Filets et lignes de séparation ; bandeaux gris sous les titres ; feuille
  unique sur fond teinté.
- Fil d'Ariane et décompte des nœuds au-dessus de la liste (le contexte est
  devenu des cartes).
- Halo bleu au survol ; flèche « ▾ » devant une ligne dépliée.
- Titre ouvert qui se replie seul en atteignant le haut (sauts) ; titre
  ouvert non fixé.
- Bouton et script à la place de `<details>`.
- « Open » toujours visible ; en-tête « Text ».

## Questions ouvertes

- **Poids de la page** : chaque vue détaillée est dans le HTML (repliée). À
  mesurer sur le plus gros sous-arbre ; si c'est trop lourd, la rendre au
  premier dépliage.
