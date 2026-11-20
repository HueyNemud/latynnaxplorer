# Composant : facettes de structure (volumes et rubriques)

Fiche de composant. Elle décline la section « Facettes » de `docs/DESIGN.md`
(et « Sélection et focus ») : les panneaux à gauche de la vue, la carte d'un
volume, la ligne de l'arbre des rubriques, le bouton qui applique la
sélection. Contrôles de Radix Themes. Essais écartés en fin de fiche.

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
- **Filtrer à la coche** : chaque coche s'applique aussitôt ;
  le champ de recherche envoie aussi les cases (formulaire GET, attribut
  `form`).
- **Radix d'abord** : boutons, cases, coche ronde et vignette
  sont des composants de Radix Themes ; `<details>` natif pour déplier
  l'arbre. Les facettes demandent du script.
- **Seule navigation** : seules les facettes (et la recherche) changent la
  sélection ; la Liste ne le fait pas.
- **Facettes hiérarchiques** : Contents est local au volume regardé ; ses
  actions (All, Clear) ne touchent que lui.

## Ce que les données imposent

Relevé sur 1807 :

| Constat | Conséquence pour le composant |
|---|---|
| Un volume en base, des dizaines (voire centaines) à terme | cartes en colonne dans un panneau étroit, qui défile ; pas de carrousel |
| `volume.json` sans titre (`dc:title` vide) | la carte montre l'année et l'identifiant (`1807_AD75-PER292`), coupé où il faut |
| Aucune image de volume pour l'instant (IIIF plus tard) | vignette provisoire : une carte, l'année dessus |
| 603 rubriques, 43 au premier niveau, jusqu'à 149 sous une même rubrique, 7 niveaux | arbre replié par défaut, dépliable par niveau ; retrait simple |
| Intitulés : 24 caractères en médiane, 71 au-delà de 60, 197 au plus ; casse imprimée variable | une ligne, coupée par « … », intitulé entier en infobulle ; casse imprimée gardée |
| Deux intitulés gardent des marques Markdown (`##`, `\`) | affichés tels quels (demande à numrev en cours) |
| Décomptes de 0 à 13 311 entrées ; 30 rubriques sans entrée | chiffres tabulaires, séparateur de milliers, alignés à droite ; 0 affiché |
| 90 éléments hors champ à la racine, sous aucune rubrique | aucune case pour eux : sélectionnables par la recherche seulement |
| Décomptes en 0,5 à 36 ms selon le texte cherché | calculés à chaque requête, avec le texte |

## Langue

Interface en anglais : « Volumes », « Contents », « All », « Clear »,
infobulles et noms accessibles. Intitulés des rubriques en français, tels
qu'imprimés (`lang="fr"` à prévoir sur l'intitulé).

## Anatomie

```
┌──────────┬─┬──────────────────────────────┬─┬───────────────────────────────┐
│ ◉        │‹│ [     All     ] [   Clear   ] │‹│      🔍 Search_______          │
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
  `--gray-2`, chevron puis titre écrit de bas en haut (`writing-mode`),
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
| Repos | fond `--gray-2`, chevron et titre `--gray-11` |
| Survol | fond `--gray-3`, chevron et titre `--gray-12` |
| Focus clavier | anneau `--focus-8`, comme les composants de Radix |

## Carte de volume

Une carte par volume, dans l'ordre des dates, 8 rem de large.

- **Vignette** (provisoire) : Card « classic » de Radix (fond blanc, relief
  et survol de Radix) au format 3 : 4 ; l'année en gras, puis le nom du
  volume en petit et atténué, centrés. Rien sous la carte, pas de décompte.
- **Focus** : un clic sur la vignette met le volume au focus ; Contents
  montre son arbre. La vignette au focus est **cernée** (2 px `--gray-12`, à
  2 px de la vignette) et porte une **encoche** (triangle
  de 0,5 rem) sur son bord droit, pointée vers Contents. Un seul volume au
  focus ; par défaut le premier volume coché, sinon le premier volume. Le
  focus n'est pas dans l'URL.
- **Sélection** : une **coche ronde** de 1,5 rem en haut à gauche de la
  vignette, posée dessus : la Checkbox de Radix, rendue ronde par ses
  variables CSS (`--checkbox-size`, `--checkbox-border-radius`). Pleine si
  tout le volume est sélectionné (toutes ses rubriques de premier niveau),
  avec un tiret si une partie seulement l'est. Un clic coche tout le volume
  (s'il est vide ou en partie coché), ou le vide (s'il est entier).

| État | Vignette | Coche ronde |
|---|---|---|
| Repos | carte en relief | cercle vide (Radix) |
| Survol de la vignette | relief de Radix | — |
| Focus (volume regardé) | cernée, encoche à droite | — |
| Entier | — | disque iris (accent), coche blanche |
| En partie | — | disque iris, tiret blanc |
| Focus clavier | anneau de Radix, sur la vignette ou sur la coche | idem |

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
  descendants sont **couvertes**, cochées en pâle ; la décocher les libère,
  décochées.
- **Cliquer une case couverte** ne garde qu'elle : la rubrique qui la
  couvre (même plusieurs niveaux au-dessus) est décochée, elle seule est
  cochée ; les autres coches ne changent pas. Un clic, une requête, au lieu
  de deux. « A sauf B » n'est pas proposé : une union de sous-arbres ne sait
  pas l'exprimer sans perdre les entrées propres de A. Infobulle « Keep only
  this section (included in: A) ».
- **Dépliage à l'arrivée** : le chemin des rubriques cochées est déplié,
  le reste replié.
- **Appliquer** : chaque coche s'applique, après 300 ms sans nouvelle
  coche (les coches rapprochées font une seule requête) ; l'URL est
  remplacée par une navigation client, sans nouvelle entrée d'historique ;
  la vue est estompée pendant le chargement ; le volume regardé et l'arbre
  déplié restent. Les cases sont l'état du composant, lu une fois depuis
  l'URL. Une entrée désignée par l'URL ne coche rien et n'est pas située.

| État | Rendu |
|---|---|
| Repos | Checkbox de Radix (taille 1), intitulé `--gray-12` |
| Survol | fond `--gray-2` sur la ligne |
| Cochée | Checkbox cochée, iris (accent) |
| Couverte | Checkbox cochée en pâle (variante `soft`), cliquable ; intitulé inchangé |
| Semi-sélectionnée | tiret (`indeterminate`, « mixed » pour les lecteurs d'écran) : une rubrique en dessous est cochée, même dans une branche repliée ; un clic la coche entière |
| Dépliée | chevron tourné vers le bas |
| Focus clavier | anneau de Radix sur la case, anneau `--focus-8` sur la ligne |

## Boutons All et Clear

- En haut de Contents, fixés (`position: sticky`) au-dessus de l'arbre qui
  défile, fond blanc derrière eux ; **toujours là**, pour que rien ne se
  décale ; chacun sur la moitié de la largeur ; Buttons doux de Radix.
- **Locaux au volume regardé** : **All** coche toutes ses rubriques de
  premier niveau (inactif si c'est déjà le cas) ; **Clear** décoche tout
  ce volume (inactif si rien n'y est coché). Les coches des autres volumes
  ne changent pas. Comme toute coche, ils s'appliquent aussitôt, texte
  cherché gardé.
- La recherche envoie une valeur `subtree` par rubrique cochée **non
  couverte** (une case couverte, sans nom, n'est pas envoyée), y compris celles des
  volumes qui ne sont pas au focus (champs cachés).
- États (survol, inactif, focus) : ceux de Radix.

## Implémentation : ce qui est inévitable

- **Panneaux dans la grille** : `display: contents` sur le conteneur des
  panneaux, pour que chaque panneau soit une colonne de la grille de la page.
- **Cases d'un formulaire placé ailleurs** : les cases sont dans les
  panneaux, le formulaire au-dessus de la vue ; l'attribut `form` les y
  rattache sans imbriquer les formulaires.
- **Propagation des coches** : un composant client (état des cases, focus,
  panneaux ouverts), lu une fois depuis l'URL. Une case Radix est un
  bouton, avec une case cachée (attribut `form`) pour le formulaire ; sans
  script, les facettes ne servent pas.
- **Case dans un `<summary>`** : cliquer la case ne déplie pas la rubrique
  (vérifié sous Chromium).
- **Décomptes** : une requête par page, groupée par rubrique ancêtre
  (`parent_closure`), filtrée par le texte cherché.

## Jetons

Ceux du thème Radix (`--gray-*`, `--space-*`, `--radius-*`, `--focus-8`) et
ceux de la Liste (`--line-pad`, `--line-pad-y`, `--icon` : voir
`docs/composants/noeud-liste.md`). Les dimensions propres aux facettes, qui
ne servent qu'une fois, sont écrites sur place dans `app/globals.css` :
Volumes 9,5 rem, Contents 22 rem, bande 1,5 rem, carte 8 rem, coche ronde
1,5 rem, retrait de l'arbre 1,25 rem.

## Accessibilité

- **Régions** : les panneaux sont dans une `<section>` nommée « Selection » ;
  chaque panneau est une `<section>` nommée par son titre.
- **Bande** : bouton, `aria-expanded`, `aria-controls` vers le contenu
  du panneau ; infobulle « Collapse Volumes » / « Expand Volumes ».
- **Vignette** : bouton (Card de Radix), `aria-pressed` (volume au focus), nom
  « Show the contents of 1807 1807_AD75-PER292 ».
- **Coche ronde** : Checkbox de Radix (rôle `checkbox`), nom « Select 1807
  1807_AD75-PER292 ».
- **Arbre** : listes emboîtées et `<details>` natifs (rôle, état, clavier) ;
  chaque case nommée par l'intitulé de sa rubrique, chaque `summary` par
  l'intitulé seul (`aria-labelledby`), sans la case ni le décompte. Case dans un `summary` :
  élément interactif dans un autre ; accepté, à tester avec un lecteur
  d'écran.
- **Couverte** : case cochée et active ; son infobulle (description
  accessible) dit ce qu'un clic fera et quelle rubrique la couvre. Cliquer
  une case cochée qui reste cochée va contre l'usage : à tester avec un
  lecteur d'écran.
- **Sélection et focus** ne reposent pas sur la couleur seule : coche
  dessinée, contour et encoche.

## À faire / à éviter

| À faire | À éviter |
|---|---|
| une case pour sélectionner, un clic sur l'objet pour le regarder | un même geste pour les deux |
| un seul formulaire pour toute la requête | un bouton ou une URL par facette |
| composants de Radix, case couverte en pâle, tiret pour une partie | contrôles dessinés à la main |
| montrer toutes les valeurs, même à 0 | masquer les rubriques sans résultat |
| intitulés tels qu'imprimés | capitales forcées, intitulés corrigés |
| séparer les colonnes par les bandes | filets, cadres autour des panneaux |

## Essais écartés

- Carrousel de volumes ; panneaux empilés dans une seule colonne ; panneaux
  décalés du bord de la fenêtre.
- Volume racine coché comme une rubrique ; arbre de tous les volumes à la
  fois.
- Rubrique cochée = ses seuls nœuds propres, ou « A sauf B » : ne
  s'exprime pas en union de sous-arbres.
- Vignette enfoncée pour la sélection ou le focus (confondait les deux) ;
  case carrée ou bandeau « Selected » sous la vignette ; nom et décompte
  sous la carte.
- Intitulés de l'arbre en capitales.
- Bouton « Apply » (en bas puis en haut de Contents, visible ou non selon
  les changements) : remplacé par le filtre à la coche. All et Clear sur
  tous les volumes : Contents est local au volume regardé. Une entrée
  d'historique par coche.
- Boutons faits main (deux moitiés d'un même bouton, teintes pastel) ;
  Primer React et shadcn/ui, pour Radix.

## Questions ouvertes

- **Écran étroit** : les panneaux ouverts prennent 34,5 rem ; sur un
  téléphone, il faudra qu'ils passent par-dessus la vue (à concevoir).
- **Lecteur d'écran réel** : case dans un `summary`, case couverte.
- **Focus dans Contents** : une rubrique pourrait avoir le focus (atteindre
  sa place dans la vue).
- **Poids de l'arbre** : rendu entier, branches repliées comprises
  (`docs/IDEES.md`).
