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

## Fonctionnalités

| Fonctionnalité | Effet sur la sélection | Dans l'URL |
|---|---|---|
| **Sélectionner** | la construit ou la restreint par des critères | oui |
| **Suivre** | l'étend par les liens temporels | oui |
| **Inspecter** | ne la change pas : déplace le focus d'un nœud à l'autre, dans une vue, en contexte | non (plus tard peut-être, pour partager un focus) |
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

- **Place** : panneaux empilés à gauche, chacun dépliable ; la vue à
  droite. La recherche par texte reste au-dessus de la liste.
- **Panneau des volumes** : une carte cochable par volume, vignette (pour
  l'instant un aplat, l'année en surimpression) ; une carte cochée
  paraît enfoncée et porte une coche. Plusieurs volumes peuvent être
  cochés.
- **Panneau des rubriques** : l'arbre de **tous** les volumes, chacun
  replié sous sa ligne de volume, une case à cocher à gauche de chaque
  ligne. Les cartes du panneau des volumes sont les cases de ces lignes
  racines, en plus visuel.
- **Le volume est la racine de son arbre**, au-dessus de toutes ses
  rubriques ; volume et rubriques suivent la même règle :
  - cocher une ligne la sélectionne avec tout son sous-arbre, et grise
    les cases de ses descendants (cochées, inactives) ;
  - la décocher décoche et réactive ses descendants ;
  - pour choisir des rubriques dans un volume, on laisse le volume
    décoché.
- **Sélection** : l'union des sous-arbres des lignes cochées les plus
  hautes. Un volume coché comprend aussi ses nœuds hors de toute rubrique
  (1807 : 90 éléments hors champ à la racine).
- **Combinaison** : union à l'intérieur des facettes de structure,
  conjonction avec les autres critères (le texte cherché dans ce
  périmètre).
- **Application** : par un bouton, qui envoie la requête ; la propagation
  des coches demande un peu de script, sans `nuqs`.
- Le volume racine ne demande pas le nœud racine attendu de numrev
  (`docs/demandes/numrev_noeud_racine.md`) : le critère porte sur le
  volume de chaque nœud, déjà en base.

À trancher sur la maquette : nom du panneau des rubriques, décomptes par
ligne, panneaux sur un écran étroit, apparence de l'arbre (proche des
titres de la Liste, en plus compact).

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
