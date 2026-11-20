# Composant : facettes de structure (volumes et rubriques)

Fiche de composant. Elle décline la section « Facettes » de `docs/DESIGN.md`
(et « Sélection et focus ») : les panneaux à gauche de la vue, la carte d'un
volume, la ligne de l'arbre des rubriques, le bouton qui applique la
sélection. Maquette du sprint 8, revue à l'écran sous Chromium et Firefox.
Essais écartés en fin de fiche.

## Problème

Composer une sélection par la structure des annuaires : choisir des volumes,
puis des rubriques dans ces volumes, en voyant toutes les valeurs possibles
(cochées ou non) et ce que chacune contient ; distinguer ce que l'on
**sélectionne** (ce que l'on retient) de ce que l'on **regarde** (le volume
dont on parcourt les rubriques) ; laisser toute la place à la vue quand on
n'en a pas besoin.

## Principe

- **Colonnes de Miller** : Volumes, puis Contents, puis la vue. Chaque
  colonne montre le niveau suivant de ce qui a le focus dans la précédente
  (comme la présentation en colonnes du Finder).
- **Panneaux coulissants** : chaque panneau se replie en une bande verticale
  sur son côté droit.
- **Sélection et focus distincts** : une case pour sélectionner, un clic sur
  l'objet pour le regarder.
- **Une seule requête** : le champ de recherche et les cases des rubriques
  forment un seul formulaire GET natif ; le script ne sert qu'à propager les
  coches.
- **Natif d'abord** : `<details>` pour déplier l'arbre, cases à cocher
  natives (`disabled` natif pour une case couverte), boutons natifs.

## Ce que les données imposent

Relevé sur 1807 :

| Constat | Conséquence pour le composant |
|---|---|
| Un volume en base, des dizaines (voire centaines) à terme | cartes en colonne dans un panneau étroit, qui défile ; pas de carrousel |
| `volume.json` sans titre (`dc:title` vide) | la carte montre l'année et l'identifiant (`1807_AD75-PER292`), coupé où il faut |
| Aucune image de volume pour l'instant (IIIF plus tard) | vignette provisoire : un aplat, l'année dessus |
| 603 rubriques, 43 au premier niveau, jusqu'à 149 sous une même rubrique, 7 niveaux | arbre replié par défaut, dépliable par niveau ; retrait simple |
| Intitulés : 24 caractères en médiane, 71 au-delà de 60, 197 au plus ; casse imprimée variable | une ligne, coupée par « … », intitulé entier en infobulle ; casse imprimée gardée |
| Deux intitulés gardent des marques Markdown (`##`, `\`) | affichés tels quels (demande à numrev en cours) |
| Décomptes de 0 à 13 311 entrées ; 30 rubriques sans entrée | chiffres tabulaires, séparateur de milliers, alignés à droite ; 0 affiché |
| 90 éléments hors champ à la racine, sous aucune rubrique | aucune case pour eux : sélectionnables par la recherche seulement |
| Décomptes en 0,5 à 36 ms selon le texte cherché | calculés à chaque requête, avec le texte |

## Langue

Interface en anglais : « Volumes », « Contents », « Apply selection »,
« Clear »,
infobulles et noms accessibles. Intitulés des rubriques en français, tels
qu'imprimés (`lang="fr"` à prévoir sur l'intitulé).

## Anatomie

```
┌──────────┬─┬──────────────────────────────┬─┬───────────────────────────────┐
│ ◉        │‹│ [ Apply selection │ Clear  ] │‹│      🔍 Search_______          │
│   1807   │V│ › ☐ LISTES PARTICULIÈRES… 13,311│C│                          Page │
│ 1807_AD75│o│   ☑ LISTE DE NON-COMM… 3,277 │o│ ┌› ADMINISTRATION GÉNÉRALE…  178 │
│ -PER292  ▶l│ ⌄ ☑ ADMINISTRATION GÉN…  234 │n│ │ › M. Lavallette, …         178 │
│ (cernée) │u│     ▣ Conseiller d'état…   1 │t│ …                              │
│ ○        │m│     ▣ Administrateurs…     7 │e│                                │
│   1810   │e│   ☐ DOCTEURS EN MÉDECINE. 335│n│                                │
│          │s│   …                          │t│                                │
│          │ │                              │s│                                │
└──────────┴─┴──────────────────────────────┴─┴───────────────────────────────┘
  Volumes  bande      Contents             bande    vue (centrée, 64rem au plus)
```

◉ coche ronde pleine, ○ vide ; ☑ case cochée ; ▣ case couverte (cochée,
grisée) ; ▶ encoche du volume au focus.

- **Mise en page** : grille de trois colonnes, Volumes | Contents | vue,
  collée au bord gauche de la fenêtre. Chaque panneau tient la hauteur de la
  fenêtre (fixé en haut) et défile à part ; la vue défile avec la page.
- **Vue** : centrée dans la place qui reste, à la largeur habituelle du site
  (64 rem), pleine largeur si la place manque. Le champ de recherche reste
  au-dessus d'elle.

## Panneau

Un `<section>` nommé par son titre : son contenu, puis à sa droite la
**bande de repli**.

- **Bande** : bouton de toute la hauteur, 1,5 rem de large, fond
  `--color-open`, chevron puis titre écrit de bas en haut (`writing-mode`),
  en petit et atténué. Chevron vers la gauche (‹) panneau ouvert, vers la
  droite (›) replié. Elle sert aussi de séparation entre les colonnes : pas
  d'autre filet.
- **Replié** : il ne reste que la bande ; le contenu est masqué (`hidden`)
  mais reste dans le formulaire (ses cases sont toujours envoyées).
- **Liés par niveau** : les panneaux ouverts sont toujours les premiers.
  Déplier un panneau déplie ceux des niveaux au-dessus ; en replier un
  replie ceux des niveaux en dessous. Mettre le focus sur un volume rouvre
  Contents.
- **Largeurs** : Volumes 9,5 rem, Contents 22 rem (contenus, hors bande).
- Pas de titre en haut du panneau ouvert : il est sur la bande.

| État de la bande | Rendu |
|---|---|
| Repos | fond `--color-open`, chevron et titre `--color-muted` |
| Survol | fond `--color-press`, chevron et titre `--color-text` |
| Focus clavier | contour habituel |

## Carte de volume

Une carte par volume, dans l'ordre des dates, 8 rem de large.

- **Vignette** (provisoire) : aplat `--color-open` au format 3 : 4, coins
  `--radius-card`, en relief (`--shadow-raised`) ; l'année en gras, puis le
  nom du volume en petit et atténué, centrés. Rien sous la carte, pas de
  décompte.
- **Focus** : un clic sur la vignette met le volume au focus ; Contents
  montre son arbre. La vignette au focus est **cernée** de l'anneau du focus
  clavier (`--ring` : 2 px `--color-text`, à 2 px de la vignette) et porte une **encoche** (triangle
  de 0,5 rem) sur son bord droit, pointée vers Contents. Un seul volume au
  focus ; par défaut le premier volume coché, sinon le premier volume. Le
  focus n'est pas dans l'URL.
- **Sélection** : une **coche ronde** de 1,5 rem en haut à gauche de la
  vignette, posée dessus. Un volume est sélectionné si une rubrique au moins
  l'est. Cocher sélectionne tout le volume (toutes ses rubriques de premier
  niveau, qui restent actives) ; décocher le désélectionne tout entier.

| État | Vignette | Coche ronde |
|---|---|---|
| Repos | aplat en relief | cercle vide, trait 2 px `--color-muted`, fond blanc |
| Survol de la vignette | fond `--color-press` | — |
| Survol de la coche | — | trait `--color-text` |
| Focus (volume regardé) | cernée, encoche à droite | — |
| Sélectionné | — | disque `--color-text`, coche blanche |
| Focus clavier | contour habituel, sur la vignette ou sur la coche | idem |

## Ligne de l'arbre (Contents)

L'arbre des rubriques du volume au focus, sans rappeler le volume en tête.
Une rubrique qui a des sous-rubriques est un `<details>` dont la ligne est le
`<summary>` ; les autres sont une ligne simple.

- **Ligne** : chevron (s'il y a des sous-rubriques), case, intitulé, décompte.
  Grille `case | intitulé | décompte`. La ligne est celle de la Liste
  (`.row` dans `app/globals.css`) : mêmes marges, même chevron dans la marge
  gauche, même fond au survol.
- **Intitulé** : casse imprimée, une ligne, coupé par « … », entier en
  infobulle.
- **Décompte** : nombre d'entrées du sous-arbre, compte tenu du texte cherché
  (pas des cases cochées : il dit ce que l'on obtiendrait en cochant la
  ligne) ; petit, atténué, chiffres tabulaires, aligné à droite.
- **Retrait** : 1,25 rem par niveau ; pas de guides de niveau.
- **Clic** : sur la case, coche sans déplier ; sur l'intitulé ou le chevron,
  déplie sans cocher.
- **Cocher** prend la rubrique avec tout son sous-arbre : les cases de ses
  descendants sont **couvertes**, cochées et grisées (`disabled` natif) ; la
  décocher les réactive, décochées.
- **Dépliage à l'arrivée** : le chemin des rubriques cochées est déplié,
  le reste replié.
- **Après une navigation** (lien de la Liste, fil d'Ariane, Précédent) :
  les cases reprennent les coches de l'URL ; le volume au focus et les
  rubriques dépliées restent, le chemin de la nouvelle sélection est
  déplié en plus. Une sélection qui n'est pas une rubrique (une entrée) ne
  coche rien : sa rubrique est dépliée, son volume mis au focus.

| État | Rendu |
|---|---|
| Repos | case native, intitulé `--color-text` |
| Survol | fond `--color-open` sur la ligne |
| Cochée | case native cochée (`accent-color: --color-text`) |
| Couverte | case cochée grisée par le navigateur, inactive ; intitulé inchangé |
| Dépliée | chevron tourné vers le bas |
| Focus clavier | contour habituel, sur la case ou sur la ligne |

## Boutons Apply et Clear (sprint 10)

- En haut de Contents, fixés (`position: sticky`) au-dessus de l'arbre qui
  défile, fond blanc derrière eux ; **toujours là**, pour que rien ne se
  décale.
- Les **deux moitiés d'un même bouton**, chacune sur la moitié de la
  largeur : coins arrondis à l'extérieur seulement, un seul trait au
  milieu (celui d'un bouton actif passe devant).
- **Apply selection** : envoie le formulaire de la requête
  (`form="query"`) : le texte, et une valeur `subtree` par rubrique cochée
  **non couverte** (une case désactivée n'est pas envoyée), y compris
  celles des volumes qui ne sont pas au focus (champs cachés). Inactif
  quand les cases ne diffèrent pas de la sélection affichée.
- **Clear** : son propre formulaire GET, qui ne porte que le texte cherché
  de la sélection affichée : applique aussitôt une sélection sans coche
  (tout l'annuaire si un texte est cherché, rien sinon). Inactif quand rien
  n'est coché.

| État | Rendu |
|---|---|
| Actif | fond `--color-action`, trait `--color-text` |
| Survol (actif) | inversé : fond `--color-text`, texte blanc |
| Inactif | fond blanc, texte `--color-muted`, trait `--color-guide-faded` |

Rendu provisoire : jugé « extrêmement moche », il sera refait avec Radix
Themes au sprint 11 (`docs/SPRINTS.md`).

## Implémentation : ce qui est inévitable

- **Panneaux dans la grille** : `display: contents` sur le conteneur des
  panneaux, pour que chaque panneau soit une colonne de la grille de la page.
- **Cases d'un formulaire placé ailleurs** : les cases sont dans les
  panneaux, le formulaire au-dessus de la vue ; l'attribut `form` les y
  rattache sans imbriquer les formulaires.
- **Propagation des coches** : un composant client (état des cases, focus,
  panneaux ouverts, rubriques dépliées). Sans script, Entrée dans le champ
  de recherche envoie encore les cases, sans propagation ni case grisée ;
  Apply, inactif au rendu du serveur, ne sert pas.
- **Conformité à l'URL** : la navigation de Next garde le composant ; il
  retient les `subtree` reçus et, quand ils changent, reprend les coches
  pendant le rendu (sans effet). Le dépliage est suivi par `onToggle` sur
  les `<details>`, pour qu'il survive à la navigation.
- **Case dans un `<summary>`** : cliquer la case ne déplie pas la rubrique
  (vérifié sous Chromium et Firefox).
- **Coche ronde** : case native redessinée (`appearance: none`), coche en SVG
  en image de fond ; reste une case pour le clavier et les lecteurs d'écran.
- **Décomptes** : une requête par page, groupée par rubrique ancêtre
  (`parent_closure`), filtrée par le texte cherché.

## Jetons

Jetons existants (`app/globals.css`, voir `docs/composants/noeud-liste.md`) :
`--color-text`, `--color-muted`, `--color-background`, `--color-open`,
`--shadow-raised`, `--radius-card`, `--line-pad`, `--line-pad-y`, `--icon`,
`--size-small`, `--tracking-caps`, `--ring`, `--space-*`. Nouveaux :

| Jeton | Valeur | Usage |
|---|---|---|
| `--color-press` | `#eef1f4` | survol d'une bande ou d'une vignette (un cran sous `--color-open`) |
| `--color-action` | `--tint-subj` | Apply et Clear quand ils servent (sprint 10, provisoire) |
| `--panel-volumes` | `9.5rem` | largeur de Volumes |
| `--panel-contents` | `22rem` | largeur de Contents |
| `--strip-width` | `1.5rem` | bande de repli |
| `--card-width` | `8rem` | carte de volume |
| `--select-size` | `1.5rem` | coche ronde |
| `--tree-indent` | `1.25rem` | retrait par niveau de l'arbre |

## Accessibilité

- **Régions** : les panneaux sont dans une `<section>` nommée « Selection » ;
  chaque panneau est une `<section>` nommée par son titre.
- **Bande** : bouton natif, `aria-expanded`, `aria-controls` vers le contenu
  du panneau ; infobulle « Collapse Volumes » / « Expand Volumes ».
- **Vignette** : bouton natif, `aria-pressed` (volume au focus), nom
  « Show the contents of 1807 1807_AD75-PER292 ».
- **Coche ronde** : case native, nom « Select 1807 1807_AD75-PER292 ».
- **Arbre** : listes emboîtées et `<details>` natifs (rôle, état, clavier) ;
  chaque case nommée par l'intitulé de sa rubrique, chaque `summary` par
  l'intitulé seul (`aria-labelledby`), sans la case ni le décompte. Case dans un `summary` :
  élément interactif dans un autre, comme le lien de la Liste ; accepté, à
  tester avec un lecteur d'écran.
- **Couverte** : `disabled` natif, annoncé comme « indisponible » ; la raison
  (rubrique parente cochée) n'est pas dite : à tester.
- **Sélection et focus** ne reposent pas sur la couleur seule : coche
  dessinée, contour et encoche.

## À faire / à éviter

| À faire | À éviter |
|---|---|
| une case pour sélectionner, un clic sur l'objet pour le regarder | un même geste pour les deux |
| un seul formulaire pour toute la requête | un bouton ou une URL par facette |
| cases natives, `disabled` natif pour une case couverte | état mi-coché, cases dessinées en script |
| montrer toutes les valeurs, même à 0 | masquer les rubriques sans résultat |
| intitulés tels qu'imprimés | capitales forcées, intitulés corrigés |
| séparer les colonnes par les bandes | filets, cadres autour des panneaux |

## Essais écartés

Sprint 8 :

- Carrousel de volumes (le volume au centre donne l'arbre) : tient mal la
  quantité, mélangeait sélection et focus.
- Panneaux empilés verticalement dans une seule colonne, dépliables par
  `<details>`, puis repliés en bande avec le titre en haut à gauche.
- Panneaux décalés du bord de la fenêtre (vue et panneaux centrés ensemble).
- Volume racine de l'arbre, coché comme une rubrique (tout l'arbre grisé) ;
  arbre de tous les volumes, chacun sous sa ligne de volume.
- Rubrique cochée = ses seuls nœuds propres (on pouvait décocher une
  sous-rubrique) : trop complexe.
- Volume « mi-coché » (tiret) quand une partie de ses rubriques l'est.
- Vignette enfoncée pour le volume coché, puis pour le volume au focus :
  confondait les deux.
- Petite case carrée sur la vignette ; bandeau « Select / Partly selected /
  Selected » sous la vignette.
- Nom, identifiant et décompte sous la carte ; nom du volume rappelé en tête
  de Contents.
- Intitulés de l'arbre en capitales, comme les titres de la Liste.
- Bouton « Apply » plein, foncé, toujours visible en bas de la pile ; bouton
  à droite du champ de recherche.

Sprint 10 :

- Filtrer à la coche, sans bouton (`docs/IDEES.md`).
- Apply en bas de Contents, visible seulement s'il y a des changements :
  remonté en haut, toujours là, avec Clear.
- Boutons séparés en pilule ; teintes vert, jaune, gris (planche) ; le
  bleu retenu en attendant Radix Themes.

## Questions ouvertes

- **Écran étroit** : les panneaux ouverts prennent 34,5 rem ; sur un
  téléphone, il faudra qu'ils passent par-dessus la vue (à concevoir).
- **Lecteur d'écran réel** : case dans un `summary`, case couverte.
- **Focus dans Contents** : une rubrique pourrait avoir le focus (atteindre
  sa place dans la vue) ; pas dans ce sprint.
- **Poids de l'arbre** : rendu entier, branches repliées comprises
  (`docs/IDEES.md`).
