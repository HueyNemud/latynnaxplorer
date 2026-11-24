# Concept de design

Principes d'UX et d'UI du site : ce que l'on sélectionne, comment on
l'affiche, ce que l'on peut en faire. Le comportement détaillé de chaque
composant est dans sa fiche (`docs/composants/`).

## Objectif

Un outil d'exploration visuelle, de sélection et d'export du contenu des
annuaires extraits par numrev.

## Vocabulaire

Un terme par objet, partout (docs, commentaires, code). L'interface est en
anglais (« Section », « Subject »…).

| Terme | Code | Ce que c'est |
|---|---|---|
| volume | `Volume` | un annuaire d'une année : un livrable numrev, un fichier |
| nœud | `SubgraphNode` | ce que numrev extrait : une rubrique, une entrée ou un élément hors champ |
| rubrique | `section` | une division de l'annuaire ; son texte est son **intitulé** (`heading` chez numrev) |
| entrée | `entry` | une ligne de l'annuaire : une personne, une maison |
| élément hors champ | `out_of_scope` | titre courant, numéro de page, note, texte libre |
| empan | `Span` | un morceau d'une entrée, de libellé sujet (`SUBJ`), description (`DESC`) ou adresse (`ADDR`) |
| ancre | `Anchor` | la boîte d'un nœud sur une page de la source |
| ordre de lecture | `documentReadingOrder` | le rang d'un nœud dans son volume |
| requête | `Query` | les critères, lus dans l'URL |
| critère | `subtree`, `text`, `in` | une condition de la requête ; tous se combinent |
| nœud désigné | `subtree` | un nœud dont la requête veut tout le sous-arbre |
| zone | `Zone` | où chercher le texte : un libellé d'empan, ou `other` (hors empan) |
| sélection | `selection` | les nœuds que donne la requête (le sous-graphe induit) |
| contexte | `context` | les rubriques ancêtres de la sélection qui n'en font pas partie |
| chemin | `path` | les rubriques au-dessus d'un nœud, de la racine à son parent |
| fiche | `detail` | un nœud montré en détail |
| vue | — | la sélection disposée selon un domaine : Liste, Page, Carte, Frise |
| focus | `focus` | ce que l'on regarde, sans changer la sélection |
| facettes | `Facets` | les panneaux Volumes et Contents, qui composent la sélection |
| case | `checked` | la case à cocher d'une rubrique : cochée, couverte ou cochée en partie ; celle d'un volume est la **case ronde** |

## Profils

- Historien de Paris, plutôt quantitatif : histoire sociale ou économique.
- Historien aux approches microhistoriques : un quartier ou un réseau
  d'individus.
- Historien de l'art ou de l'architecture : un lieu précis ou une
  activité professionnelle.
- Généalogiste qui suit une personne ou une maison de commerce.
- L'équipe numrev, qui vérifie l'extraction contre la source.

## Domaines des données

Les nœuds se décrivent selon cinq domaines. Chacun sert à deux choses
indépendantes : **sélectionner** (des critères) et **afficher** (une vue).

| Domaine | Ce qu'il couvre | Critères possibles | Vue qui dispose selon lui |
|---|---|---|---|
| Contenu | texte, empans | nom, activité, adresse | aucune : toute représentation de nœud le porte |
| Structure | rubriques, ordre de lecture | une rubrique et sa descendance | Liste |
| Document | page, ancre | une page, une plage de pages | Page |
| Espace | géométrie | un secteur de la carte | Carte |
| Temps | date, liens temporels | une période | Frise |

## Sélection et vues : deux choses indépendantes

- **Sélection** : conjonction de critères portant sur n'importe quels
  domaines (rubrique X *et* période P *et* secteur S), étendue au besoin
  par les liens. C'est le sous-graphe induit ; elle est dans l'URL.
- **Vue** : la sélection disposée selon **un** domaine. Changer de vue ne
  change pas la sélection.
- Une vue est l'endroit naturel pour **poser** un critère sur son propre
  domaine (tracer un secteur sur la carte, une période sur la frise) ; une
  fois posé, le critère vaut pour toutes les vues.
- Une vue montre toute la sélection, ou dit ce qu'elle ne peut pas placer
  (« 12 nœuds sans coordonnées »).

| Vue | Disposition | Arcs montrés |
|---|---|---|
| Liste | ordre de lecture | `member_of` / `child_of` (rubriques), `follows` (contiguïté) |
| Page | la page source | ordre de lecture |
| Carte | la géographie | à définir (déménagements, par les liens temporels ?) |
| Frise | la chronologie, une ligne par lignée | liens temporels |

## Sélection et focus

- **Sélection** : ce que l'on retient. Dans l'URL ; les vues la montrent,
  l'export la récupère. Seuls les critères la changent.
- **Focus** : ce que l'on regarde, mis en avant pour être vu en détail ou
  servir de point de départ, sans rien changer à la sélection. Il peut
  porter hors de la sélection (un volume non coché). Hors de l'URL pour
  l'instant.

| Où | Sélection | Focus |
|---|---|---|
| Panneau Volumes | la case ronde sur la vignette | la vignette cliquée, cernée : Contents montre ses rubriques |
| Panneau Contents | les cases des rubriques | à venir (atteindre une rubrique dans la vue ?) |
| Vue Liste | ce qu'elle montre | le nœud déplié en sa fiche |
| Vues côte à côte (plus tard) | la même pour toutes | partagé : le nœud au focus dans l'une l'est dans l'autre |

La sélection se marque par des cases à cocher, le focus par un état cerné
ou ouvert ; le focus clavier (`:focus-visible`) garde le contour habituel.

## Fonctionnalités

| Fonctionnalité | Effet sur la sélection | Dans l'URL |
|---|---|---|
| **Sélectionner** | la construit ou la restreint par des critères | oui |
| **Suivre** | l'étend par les liens temporels | oui |
| **Inspecter** | aucun : déplace le focus d'un nœud à l'autre, dans une vue | non |
| **Exporter** | la récupère dans un format de données | non |

- Comparer des entrées, les situer, les vérifier contre la source sont des
  façons d'**inspecter**, dans la vue qui convient.
- L'export n'est pas une vue : c'est le même sous-graphe dans un format de
  données.

## Facettes

Une facette montre **toutes les valeurs possibles** d'un critère, cochées
ou non, là où la vue ne montre que la sélection (une rubrique exclue
disparaît de la Liste : on ne pourrait pas l'y recocher). Les facettes
servent à composer la sélection, la vue à la regarder. Premier domaine
couvert : la Structure, volumes et rubriques (`docs/composants/facettes.md`).

- Colonnes de Miller collées à gauche : Volumes, Contents, puis la vue.
- Seules les facettes et la recherche changent la sélection : la Liste n'a
  aucun lien qui le fasse.
- Sans aucun critère, rien n'est sélectionné ; la vue le dit (« Nothing to
  show », ou « No match » quand les critères ne trouvent rien).

## Barre de la vue

En haut de la vue, une barre toujours visible porte la recherche (et plus
tard les autres critères) ; la vue défile dessous. À gauche, un bouton par
zone (Subj, Desc, Addr, Other), aux couleurs de ses empans dans la Liste :
enfoncé, la zone est fouillée ; relâché, elle ne l'est pas ; un clic ne
lance rien. Puis le champ, plus grand, soudé à son bouton Search ; Entrée
ou Search lance la recherche, en gardant les rubriques cochées. Au bout de
la barre, le bouton Export CSV, inactif quand rien n'est sélectionné.

## Export

Toute la sélection (pas seulement ce que la vue montre, jamais le
contexte), en CSV fabriqué dans le navigateur : `latynnaxplorer-selection.csv`,
UTF-8 avec BOM (pour les tableurs), virgules, fins de ligne CRLF
(`lib/export/csv.ts`).

- Une ligne par nœud, tous types confondus, volume après volume, chacun
  dans l'ordre de lecture.
- Colonnes : `volume`, `id`, `kind`, `parent_id`, `reading_order` ; une
  colonne `section_<n>` par niveau de rubrique du chemin, autant que le
  chemin le plus long de la sélection ; `text` ; `subject`, `description`,
  `address`, le texte normalisé de ses empans ; `pages`, celles de ses
  ancres.
- Plusieurs valeurs dans une case (empans de même libellé, pages) sont
  séparées par ` | `. Les textes sont ceux de numrev, marques d'emphase
  comprises.

## Représentation d'un nœud

Un nœud a une représentation par vue, compacte (parmi d'autres) ou
détaillée (sa fiche). Le contenu (texte, empans) est porté par toutes.

| Vue | Compacte | Fiche | Disponible |
|---|---|---|---|
| Liste | une ligne de texte imprimé, empans sur fond coloré ; une rubrique est marquée par son guide de niveau, son intitulé fixé en haut | dépliée sous la ligne | maintenant |
| Page | la boîte du nœud sur sa page (vignette) | la page, boîte surlignée | ancres présentes, images à venir (IIIF) |
| Carte | un point | le point dans son quartier | après le géocodage |
| Frise | un repère | sa date ; plus tard, ses entrées liées | date du volume maintenant, liens plus tard |

Une sélection d'un seul nœud est ce nœud dans toutes ses représentations
disponibles, en fiche, chacune dans son contexte : pas de page « fiche » à
part.

## Principes d'affichage

- **Contexte** : chaque vue montre la sélection dans son contexte (la page
  autour des boîtes, la carte autour des points, les rubriques autour des
  entrées), avec les mêmes représentations ; il ne montre que ce qui mène à
  elle et n'est jamais compté dedans.
- **Densité** : un nœud seul est déplié en sa fiche, plusieurs sont
  compacts ; chacun peut se déplier (inspecter).
- **Vues** : une à la fois pour commencer, le focus pensé dès le départ
  comme partagé ; à terme, deux côte à côte (Liste + Page, Liste + Carte…).
- **Composants** : ceux de Radix Themes, sur son thème (accent iris, gris
  mauve) ; nos styles seulement pour ce que Radix n'a pas (guides de la
  Liste, arbre de Contents, panneaux), avec ses jetons.
- **La source à un clic** : depuis tout nœud, dans toute vue, la page
  d'origine est accessible.
