# Composant : facettes de structure (volumes et rubriques)

Les panneaux à gauche de la vue (`components/Facets.tsx`,
`components/Panel.tsx`), qui déclinent « Facettes » et « Sélection et
focus » de `docs/DESIGN.md`. Règles des cases en fonctions pures :
`lib/facets/selection.ts`. Contrôles de Radix Themes.

## Ce que les données imposent

Relevé sur 1807 :

| Constat | Conséquence |
|---|---|
| Un volume aujourd'hui, des dizaines à terme | cartes en colonne dans un panneau étroit, qui défile |
| `volume.json` sans titre | la carte montre l'année et l'identifiant (`1807_AD75-PER292`) |
| Aucune image de volume (IIIF plus tard) | vignette provisoire : une carte, l'année dessus |
| 603 rubriques, 43 au premier niveau, jusqu'à 149 sous une même rubrique, 7 niveaux | arbre replié par défaut, retrait simple |
| Intitulés : 24 caractères en médiane, 197 au plus ; casse imprimée variable | une ligne, coupée par « … », entier en infobulle ; casse imprimée gardée |
| Décomptes de 0 à 13 311 entrées | chiffres tabulaires, séparateur de milliers, alignés à droite ; 0 affiché |
| 90 éléments hors champ sous aucune rubrique | aucune case pour eux : la recherche seule les trouve, réglage coché (racine demandée à numrev) |

## Anatomie

```
┌──────────┬─┬────────────────────────────────┬─┬────────────────────┐
│ ◉        │‹│ [            Clear           ] │‹│ barre de la        │
│   1807   │V│ › ☐ LISTES PARTICULIÈRES 13,311│C│ sélection          │
│ 1807_AD75│o│   ☑ LISTE DE NON-COMM…    3,277│o│                    │
│ -PER292  ▶l│ ⌄ ☑ ADMINISTRATION GÉN…     234│n│ vue                │
│ (cernée) │u│     ▣ Conseiller d'état…      1│t│                    │
│          │m│     ▣ Administrateurs…        7│e│                    │
│   1810   │e│   ☐ DOCTEURS EN MÉDECINE.   335│n│                    │
│          │s│   …                            │t│                    │
└──────────┴─┴────────────────────────────────┴─┴────────────────────┘
  Volumes  bande      Contents               bande  vue (centrée, 64 rem au plus)
```

◉ case ronde (volume au focus seulement) ; ☑ case cochée ; ▣ case couverte ; ▶ encoche
du volume au focus.

Grille de trois colonnes collée au bord gauche de la fenêtre ; chaque
panneau tient la hauteur de la fenêtre et défile à part. La vue est centrée
dans la place qui reste, 64 rem au plus.

## Panneau

Un `<section>` nommé par son titre : son contenu, puis à droite sa **bande
de repli**.

- **Bande** : bouton de toute la hauteur, 1,5 rem de large, chevron puis
  titre écrit de bas en haut ; elle sépare aussi les colonnes (pas d'autre
  filet).
- **Replié** : il ne reste que la bande ; le contenu est masqué mais ses
  cases restent dans le formulaire.
- **Liés par niveau** : les panneaux ouverts sont toujours les premiers ;
  déplier un panneau déplie ceux du dessus, en replier un replie ceux du
  dessous. Mettre un volume au focus rouvre Contents.
- **Largeurs** : Volumes 9,5 rem, Contents 22 rem, hors bande.

| État de la bande | Rendu |
|---|---|
| Repos | fond `--gray-2`, texte `--gray-11` |
| Survol | fond `--gray-3`, texte `--gray-12` |
| Focus clavier | anneau `--focus-8` |

## Carte de volume

8 rem de large, dans l'ordre des dates.

- **Vignette** (provisoire) : Card « classic » de Radix au format 3 : 4,
  l'année en gras, puis le nom du volume en petit, centrés ; rien dessous.
- **Focus** : le volume au focus est celui de la sélection (`volume` dans
  l'URL, sinon le premier) ; Contents montre ses rubriques. Vignette cernée
  (2 px `--gray-12`, à 2 px) et encoche pointée vers Contents ; son nom
  (`volumeName`) est le titre de l'onglet. Un clic sur une autre vignette
  la met au focus (nouvelle entrée d'historique) : recherche et zones
  gardées, rubriques retirées ; sur la vignette au focus, il rouvre
  Contents. Le volume est téléchargé s'il ne l'est pas : Contents attend
  (Spinner).
- **Case ronde** : la Checkbox de Radix, ronde et de 1,5 rem, en haut à
  gauche de la seule vignette au focus. Cochée si tout le volume l'est (toutes ses
  rubriques de premier niveau), tiret s'il l'est en partie, inactive tant
  que le volume n'est pas chargé. Un clic coche tout le volume, ou le vide
  s'il l'était entier.

## Arbre des rubriques (Contents)

Les rubriques du volume au focus, sans rappeler le volume. Une rubrique qui
a des sous-rubriques est un `<details>` dont la ligne est le `<summary>`.

- **Ligne** : chevron (s'il y a des sous-rubriques), case, intitulé,
  décompte ; c'est la ligne de la Liste (`.row`), mêmes marges et même
  survol. Retrait de 1,25 rem par niveau, sans guides.
- **Décompte** : entrées du sous-arbre qui contiennent le texte cherché
  (pas des cases cochées : il dit ce que donnerait la case).
- **Clic** : sur la case, coche sans déplier ; ailleurs, déplie sans
  cocher.
- **Cocher** une rubrique prend tout son sous-arbre : les cases de ses
  descendantes sont **couvertes** (cochées en pâle) ; la décocher les
  libère.
- **Cliquer une case couverte** ne garde qu'elle : la rubrique qui la
  couvre est décochée, les autres cases ne changent pas. Infobulle « Keep
  only this section (included in: A) ».
- **Cochée en partie** : une rubrique dont une descendante est cochée
  porte un tiret, même branche repliée ; un clic la coche entière.
- **À l'arrivée**, le chemin des rubriques cochées est déplié.

| État | Rendu |
|---|---|
| Repos | Checkbox de Radix (taille 1), intitulé `--gray-12` |
| Survol | fond `--gray-2` sur la ligne |
| Cochée | Checkbox cochée, iris |
| Couverte | Checkbox cochée en pâle (`soft`), cliquable |
| Cochée en partie | tiret (`indeterminate`, « mixed » pour les lecteurs d'écran) |
| Dépliée | chevron vers le bas |
| Focus clavier | anneau de Radix sur la case, `--focus-8` sur la ligne |

## Clear et application

- **Clear** décoche toutes les rubriques ; inactif quand
  il ne changerait rien. En haut de Contents, fixé au-dessus de l'arbre,
  toujours là ; bouton `soft` de Radix, sur toute la largeur. Sans case
  cochée, la rubrique ne filtre rien : tout est sélectionné.
- **Application** : chaque case s'applique aussitôt ; l'URL est remplacée
  (sans nouvelle entrée d'historique) 100 ms après le dernier clic, pour
  que des clics rapides ne donnent qu'un calcul ; la liste est estompée dès
  le clic, jusqu'à la nouvelle sélection ; volume au focus et branches
  dépliées restent.
- **Formulaire** : les cases appartiennent au formulaire de la recherche
  (attribut `form`) : une recherche envoie un `subtree` par rubrique cochée
  non couverte, et le volume (champ caché).
- Un nœud désigné qui n'est pas une rubrique ne coche rien.

## Implémentation : ce qui est inévitable

- **Panneaux dans la grille** : `display: contents` sur leur conteneur.
- **État** : les cases cochées sont l'état du composant, lu une fois depuis
  l'URL ; l'URL les suit, aucune synchronisation. Une Checkbox de Radix est
  un bouton, doublée d'une case cachée pour le formulaire.
- **Case dans un `<summary>`** : cliquer la case ne déplie pas la rubrique.
- **Rendu seulement quand il change** : les facettes (`memo`) ignorent les
  rubriques de la requête, lues une seule fois ; quand l'URL suit les
  cases, Contents ne refait pas ses lignes.

## Accessibilité

- Les panneaux sont dans une `<section>` « Selection » ; chacun est une
  `<section>` nommée par son titre.
- **Bande** : `aria-expanded`, `aria-controls` ; infobulle « Collapse
  Volumes » / « Expand Volumes ».
- **Vignette** : bouton, `aria-pressed` (focus), nom « Show the contents
  of 1807 1807_AD75-PER292 ». **Case ronde** : nom « Select all of
  1807 1807_AD75-PER292 ».
- **Arbre** : listes emboîtées et `<details>` natifs ; chaque case nommée
  par l'intitulé, chaque `summary` par l'intitulé seul
  (`aria-labelledby`).
- Sélection et focus ne reposent pas sur la couleur seule : coche
  dessinée, contour, encoche.

## À faire / à éviter

| À faire | À éviter |
|---|---|
| une case pour sélectionner, un clic sur l'objet pour le regarder | un même geste pour les deux |
| un seul formulaire pour toute la requête | un bouton ou une URL par facette |
| composants de Radix, case couverte en pâle, tiret pour une partie | contrôles dessinés à la main |
| montrer toutes les rubriques, même à 0 | masquer les rubriques sans résultat |
| intitulés tels qu'imprimés | capitales forcées, intitulés corrigés |
| séparer les colonnes par les bandes | filets, cadres autour des panneaux |

## Essais écartés

- Carrousel de volumes ; panneaux empilés dans une colonne, ou décalés du
  bord de la fenêtre ; arbre de tous les volumes à la fois.
- Rubrique cochée = ses seuls nœuds propres, ou « A sauf B ».
- Vignette enfoncée pour la sélection ou le focus (confondait les deux) ;
  case carrée ou bandeau « Selected » ; nom et décompte sous la carte.
- Bouton « Apply » : remplacé par l'application à chaque case. Clear sur
  tous les volumes. Une entrée d'historique par case.
- Sélection sur plusieurs volumes à la fois, case ronde sur chaque
  vignette (un volume pas encore chargé n'a pas de rubriques à cocher).
- Bouton All (cocher tout le volume au focus) : redondant avec « aucune
  case » et avec la case ronde du volume.

## Questions ouvertes

- **Lecteur d'écran réel** : case dans un `summary` ; case couverte, qui
  reste cochée quand on la clique.
- **Focus dans Contents** : atteindre la place d'une rubrique dans la vue.
- Écran étroit, poids de l'arbre : `docs/IDEES.md`.
