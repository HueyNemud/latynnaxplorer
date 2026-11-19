# Concept de design

Principes d'UX et d'UI du site : ce que l'on sélectionne, comment on
l'affiche, ce que l'on peut en faire. Document de travail, complété au fil
des décisions ; les choix arrêtés sont aussi résumés dans
`docs/DECISIONS.md`.

## Objectif

Un outil d'exploration visuelle, de sélection et d'export du contenu des
annuaires extraits par numrev.

## Profils

- Historien de Paris, plutôt quantitatif : histoire sociale ou économique.
- Historien aux approches microhistoriques : une petite zone ou un réseau
  d'individus.
- Historien de l'art ou de l'architecture : une zone précise ou une
  activité professionnelle.
- Généalogiste qui suit une personne ou une maison de commerce.
- L'équipe numrev, qui vérifie l'extraction contre la source.

## Domaines des données

Les nœuds (entrées, sections, éléments hors champ) se décrivent selon cinq
domaines. Chacun sert à deux choses indépendantes : **sélectionner** (des
critères) et **afficher** (une vue).

| Domaine | Ce qu'il couvre | Critères possibles | Vue qui dispose selon lui |
|---|---|---|---|
| Contenu | texte, champs SUBJ/DESC/ADDR | nom, activité, adresse (recherche tolérante) | aucune : toute représentation de nœud le porte |
| Structure | hiérarchie, ordre de lecture | une rubrique et sa descendance | Liste |
| Document | page, boîte sur la page | une page, une plage de pages | Page |
| Espace | géométrie | une zone | Carte |
| Temps | date, liens temporels | une période | Frise |

## Sélection et vues : deux choses orthogonales

- **Sélection** : conjonction de critères portant sur n'importe quels
  domaines (rubrique X *et* période P *et* zone Z), étendue au besoin par
  les liens. C'est le sous-graphe induit ; elle est dans l'URL.
- **Vue** : la sélection disposée selon **un** domaine. Changer de vue ne
  change pas la sélection.
- Une vue est l'endroit naturel pour **saisir** un critère sur son propre
  domaine (tracer une zone sur la carte, choisir une rubrique dans la
  liste, une période sur la frise) ; une fois posé, le critère vaut pour
  toutes les vues.
- Une vue montre toute la sélection, ou dit ce qu'elle ne peut pas placer
  (« 12 nœuds sans coordonnées »).

| Vue | Disposition | Arcs montrés |
|---|---|---|
| Liste | ordre du document (ou alphabétique) | `member_of` / `child_of` (regroupement), `follows` (contiguïté) |
| Page | la page source | ordre de lecture |
| Carte | la géographie | à définir (déménagements, par les liens temporels ?) |
| Frise | la chronologie, une ligne par lignée | liens temporels |

## Sélection et focus

Deux notions distinctes, dans toute l'application :

- **Sélection** : ce que l'on retient, le sous-graphe induit par les
  critères. Elle est dans l'URL ; les vues la montrent, l'export la
  récupère. Seuls les critères la changent (cocher, chercher, ouvrir un
  nœud seul).
- **Focus** : ce que l'on regarde, un élément mis en avant pour être vu
  en détail ou servir de point de départ, sans rien changer à la
  sélection. Il peut porter sur un élément hors de la sélection (un
  volume non coché, une rubrique du contexte). Hors de l'URL pour
  l'instant (plus tard peut-être, pour partager un focus).

| Où | Sélection | Focus |
|---|---|---|
| Panneau des volumes | la coche ronde sur la vignette | la vignette cliquée, cernée : son arbre s'affiche dans Contents |
| Panneau Contents | les cases des rubriques | à venir (une rubrique à atteindre dans la vue ?) |
| Vue Liste | ce qu'elle montre | le nœud déplié en sa fiche (inspecter) |
| Vues côte à côte (plus tard) | la même pour toutes | partagé : le nœud au focus dans l'une l'est dans l'autre |

- Vocabulaire visuel distinct : la sélection se marque par des cases à
  cocher, le focus par un état cerné ou ouvert. Ne pas confondre avec
  le focus clavier (`:focus-visible`), qui reste le contour habituel.

## Fonctionnalités

| Fonctionnalité | Effet sur la sélection | Dans l'URL |
|---|---|---|
| **Sélectionner** | la construit ou la restreint par des critères | oui |
| **Suivre** | l'étend par les liens temporels | oui |
| **Inspecter** | ne la change pas : déplace le focus d'un nœud à l'autre, dans une vue, en contexte (voir « Sélection et focus ») | non (plus tard peut-être, pour partager un focus) |
| **Exporter** | la récupère dans un format de données | non |

- Comparer des entrées, les situer, les vérifier contre la source sont des
  usages d'**inspecter**, dans la vue qui convient.
- **Ouvrir une entrée** (brief) remplace la sélection par ce seul nœud ;
  inspecter garde la sélection et montre le détail sur place (vue Liste :
  déplié sous la ligne).
- L'export n'est pas une vue : c'est le même sous-graphe dans un format de
  données (formats à choisir, voir « format de l'API JSON » dans
  `docs/SPRINTS.md`).

## Facettes

Une facette montre **toutes les valeurs possibles** d'un critère, cochées
ou non, là où la vue ne montre que la sélection (une rubrique exclue
disparaît de la Liste : on ne pourrait pas l'y recocher). Les facettes
servent à composer la sélection ; la vue sert à la regarder. Premier
domaine couvert (sprint 8) : la Structure, volumes et rubriques.

- **Place** : colonnes de Miller, collées au bord gauche de la fenêtre :
  Volumes, puis Contents, puis la vue, centrée dans la place qui reste.
  La recherche par texte reste au-dessus de la vue.
- **Panneaux** : chacun se replie par une bande verticale sur son côté
  droit, qui porte son titre ; replié, il ne reste que la bande. Les
  panneaux ouverts sont toujours les premiers : déplier un panneau
  déplie ceux des niveaux au-dessus, en replier un replie ceux des
  niveaux en dessous.
- **Volumes** : une carte par volume, vignette (pour l'instant un aplat,
  l'année et le nom du volume dessus, rien dessous). Une coche ronde sur
  la vignette sélectionne le volume ; un clic sur la vignette met le
  **focus** sur lui : vignette cernée, encoche pointée vers Contents.
  Plusieurs volumes peuvent être cochés, un seul est au focus.
- **Contents** : l'arbre des rubriques du volume au focus (sans le
  rappeler en tête), une case à gauche de chaque ligne, le nombre
  d'entrées de son sous-arbre à droite (compte tenu du texte cherché).
- **Cocher** :
  - un volume est sélectionné si une rubrique au moins l'est ; sa coche
    sélectionne tout le volume (toutes ses rubriques de premier niveau,
    qui restent actives) ou le désélectionne tout entier ;
  - une rubrique : la prend avec tout son sous-arbre, et grise les cases
    de ses descendants (cochées, inactives) ; la décocher les réactive,
    décochées.
- **Sélection** : l'union des sous-arbres des rubriques cochées les plus
  hautes, en conjonction avec les autres critères (le texte cherché dans
  ce périmètre). Les nœuds hors de toute rubrique (1807 : 90 éléments
  hors champ à la racine) ne sont pas sélectionnables par les facettes,
  seulement par la recherche, en attendant un vrai nœud racine de numrev.
- **Application** : la requête est un seul formulaire GET natif, le champ
  de recherche et les cases des rubriques (rattachées par l'attribut
  `form`) ; une case grisée est désactivée, donc pas envoyée : seules
  partent les rubriques cochées les plus hautes. Le bouton « Apply
  selection », en bas de Contents, fixé, sur toute sa largeur, n'apparaît
  que si les cases diffèrent de la sélection affichée ; Entrée dans le
  champ de recherche applique aussi les cases. Un peu de script propage
  les coches, sans `nuqs`.

Apparence de l'arbre de Contents : intitulés dans la casse imprimée (pas
en capitales comme les titres de la Liste), simple retrait par niveau,
sans guides de niveau ; chevron, case, intitulé tronqué sur une ligne,
décompte à droite.

## Représentation d'un nœud

Un nœud a une représentation par vue, déclinée selon une **densité** :
*compacte* (une brique parmi d'autres, dans une vue) ou *détaillée* (une
fiche). La représentation dépend aussi du type de nœud (`entry`,
`section`, `out_of_scope`) : à détailler vue par vue. Le contenu (texte,
champs) est porté par toutes.

| Vue | Compacte | Détaillée (fiche) | Disponible |
|---|---|---|---|
| Liste | une ligne de texte imprimé, champs sur fond pastel, sujet en petites capitales ; une section est un groupe marqué par son guide de niveau, son titre une ligne fixée en haut | la fiche (champs étiquetés, chemin des rubriques), dépliée sous la ligne | maintenant |
| Page | la boîte du nœud sur sa page (vignette) | la page, boîte surlignée | ancrages présents, images à venir (IIIF) |
| Carte | un point | le point dans son quartier | après le géocodage |
| Frise | un repère | sa date ; plus tard, ses entrées liées | date du volume maintenant, liens plus tard |

**La fiche** : une sélection d'un seul nœud est ce nœud dans toutes ses
représentations disponibles, en densité détaillée, côte à côte, chacune
dans son contexte (vue Liste : ses rubriques, sa ligne dépliée).
Il n'y a pas de page « fiche » à concevoir à part.

## Principes d'affichage

- **Contexte** : chaque vue montre la sélection dans son contexte (la page
  autour des boîtes, la carte autour des points, la hiérarchie autour des
  entrées). Le contexte prend les mêmes représentations que la sélection
  (vue Liste : les rubriques ancêtres sont des groupes comme les autres),
  n'en montre que ce qui mène à elle, et n'est jamais compté dedans.
- **Densité** : automatique par défaut (un nœud → déplié en sa fiche,
  plusieurs → compacte) ; dans une vue compacte, chaque nœud peut se déplier en sa
  fiche (inspecter).
- **Vues** : une à la fois pour commencer, avec un focus pensé dès le
  départ comme partagé ; à terme, deux vues côte à côte (Liste + Page,
  Liste + Carte…).
- **La source à un clic** : depuis tout nœud, dans toute vue, la page
  d'origine est accessible.
