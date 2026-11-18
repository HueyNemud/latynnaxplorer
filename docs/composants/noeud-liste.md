# Composant : nœud dans la vue Liste

Fiche de composant, à valider avant le code (sprint 4). Elle décline la
représentation d'un nœud dans la vue Liste (`docs/DESIGN.md`, « Représentation
d'un nœud ») par **type** (`entry`, `section`, `out_of_scope`) et par
**densité** (compacte, détaillée). Le sprint 4 réalise la densité détaillée ;
la densité compacte est fixée ici pour que les deux restent cohérentes, et
réalisée au sprint 5.

## Problème

Montrer un nœud tel que l'annuaire l'imprime, avec ses champs distingués,
dans son contexte (les rubriques) et avec sa source à un clic : en une ligne
parmi d'autres (compacte) ou seul (détaillée, la fiche).

## Ce que les données imposent

Relevé sur 1807 (22 158 nœuds) :

| Constat | Conséquence pour le composant |
|---|---|
| Emphase `*…*` dans 4 525 nœuds (`Gabillot aîné, *en gros*, …`) | rendue en italique, astérisques retirés |
| 24 empans coupent une emphase (l'un commence ou finit au milieu) | texte découpé en segments aux bornes des empans *et* de l'emphase, sans supposer qu'elles s'emboîtent |
| Empans en points de code, astérisques compris (`*en gros*` pour DESC) | positions lues dans `text` brut, avant tout retrait de l'emphase |
| 58 nœuds sur plusieurs lignes (groupes à accolade) | retours à la ligne conservés |
| Un groupe à accolade a plusieurs SUBJ, DESC, ADDR | les champs sont une suite ordonnée, pas un champ de chaque sorte |
| Entrées courtes (39 caractères en moyenne, 729 au plus) | une ligne en compacte le plus souvent |
| Hors champ : numéros de page, titres courants, paragraphes (jusqu'à 1 405 caractères) | compacte tronquée à deux lignes ; texte entier en détaillée |
| Sections : 197 caractères au plus, 7 niveaux d'emboîtement | chemin des rubriques long : il doit pouvoir passer à la ligne |
| Ancres : une page en général, deux pour 2 nœuds, aucune pour quelques-uns | « p. 60 », « pp. 60–61 » ou « unknown page » |

## Langue

Interface en anglais (libellés, mentions, page, fil d'Ariane) ; traduction
prévue plus tard (`docs/IDEES.md`). Le texte des annuaires reste tel quel,
en français. Les exemples de libellés ci-dessous sont ceux de l'interface.

## Propriétés

| Propriété | Type | Description |
|---|---|---|
| `node` | `{ id, kind, text, spans, anchors }` | le nœud, tel que `resolve` le renverra |
| `node.spans` | `{ label, charStart, charEnd, normalized }[]` | champs, dans l'ordre du texte |
| `node.anchors` | `{ page, x0, y0, x1, y1 }[]` | pages et boîtes, dans l'ordre des pages |
| `density` | `"compact" \| "detailed"` | choisie par la vue : un nœud → détaillée, plusieurs → compacte |
| `context` | `{ id, text }[]` | chemin des rubriques, de la racine au parent (détaillée seulement ; en compacte, c'est la vue qui le porte par regroupement) |

## Rendu commun : le texte imprimé

Toutes les variantes portent le texte de numrev **tel quel** (numrev fait foi) :
emphase en italique, retours à la ligne gardés, aucun mot corrigé ni
réordonné.

## Texte souligné (densité compacte)

Réalisé au sprint 4 (`components/PrintedText.tsx`), essayé d'abord comme
titre de la fiche puis réservé à la compacte : il en a la nature (le texte
d'un seul tenant, lisible d'un coup d'œil). Dans une entrée, chaque empan est
marqué d'un **fin soulignement
coloré**, d'une couleur par libellé, avec le **nom du libellé** en petit, de
la même couleur, sous le début du trait ; le texte lui-même garde sa couleur,
sa graisse et sa place (le nom ne le décale pas). Un badge encadré avant le
champ a été essayé et écarté : il hachait le texte.

| Libellé | Nom sous le trait | Marque |
|---|---|---|
| SUBJ | `subj` | soulignement couleur SUBJ |
| DESC | `desc` | soulignement couleur DESC |
| ADDR | `loc` | soulignement couleur ADDR |

Le texte entre les empans (virgules, points de conduite `.....`, accolades)
n'a ni nom ni soulignement : deux empans voisins restent séparés. Les noms
sont exclus de la sélection de texte : un copier-coller rend le texte imprimé
seul. Ils demandent un interligne plus grand (place sous chaque ligne).

## Variantes

### Entrée (`entry`)

- **Compacte** : une ligne de texte souligné (section précédente) ; à
  droite, la page (« p. 60 »), en retrait visuel. Retour à la ligne si le
  texte est long ou s'il a plusieurs lignes.
- **Détaillée (fiche)** : un ensemble de clés / valeurs, sans soulignement,
  sous le contexte :
  1. **Contexte** : chemin des rubriques (fil d'Ariane), en petit, liens
     non soulignés (soulignés au survol et au focus) ; chaque rubrique est
     un lien qui ouvre son sous-arbre (`?subtree=<uuid>`, nouvelle
     sélection).
  2. **Text** : le texte complet, imprimé (emphase en italique, retours à
     la ligne gardés), un peu plus grand que le reste.
  3. **Champs** : un par empan, dans l'ordre du texte (Subject,
     Description, Address, répétés pour un groupe à accolade), valeur
     `normalized`. Le texte hors empan n'y figure pas : il reste visible dans
     Text.
  4. **Métadonnées** : **Type** (Entry, Section, Out of scope), **Source**
     (« p. 60 » ; lien quand IIIF sera là), **Identifier** (l'uuid,
     sélectionnable d'un geste, pour l'équipe numrev).

  Les trois groupes sont séparés par un espace, colonnes des clés alignées.
  Essayés puis écartés au sprint 4 : texte souligné en titre (c'est la
  compacte), champs seuls sans le texte, badges encadrés avant les champs.

### Section (`section`)

Une section seule n'est sélectionnée que si elle n'a pas d'enfant (sinon
`?subtree=` ramène aussi ses descendants) : la variante détaillée est rare,
mais elle existe.

- **Compacte** : l'intitulé, en titre de groupe ; le niveau d'emboîtement se
  lit au retrait et à la taille (détails au sprint 5, avec le regroupement).
- **Détaillée** : contexte (rubriques parentes), Text (l'intitulé),
  métadonnées (Type : Section). Pas de champs (les sections n'en ont pas).

### Hors champ (`out_of_scope`)

- **Compacte** : texte atténué, plus petit, précédé de la mention « out of
  scope » (en texte, pas seulement par la couleur) ; tronqué à deux lignes
  avec points de suspension.
- **Détaillée** : contexte, Text (le texte entier), métadonnées (Type : Out
  of scope). Pas de champs.

## États (compacte, sprint 5)

| État | Rendu | Comportement |
|---|---|---|
| Par défaut | comme ci-dessus | — |
| Survol | fond légèrement teinté | aucun effet sur la sélection |
| Focus (inspecter) | contour visible, fond teinté | la fiche du nœud s'affiche à côté, la sélection ne change pas |
| Contexte | atténué, hors du décompte | nœud montré autour de la sélection sans en faire partie |

La détaillée n'a pas d'état interactif propre en dehors de ses liens.
Pas d'état de chargement : la page est rendue côté serveur.

## Jetons

Aucun jeton n'existe encore. Ceux dont ce composant a besoin, en propriétés
CSS personnalisées (valeurs fixées à l'implémentation, contraste AA vérifié) :

- Couleurs : texte, texte atténué (hors champ, page, mentions),
  soulignements et noms SUBJ, DESC et ADDR, fond de survol, contour de focus.
- Typographie : une seule police, sans empattements, pour la source comme
  pour l'interface ; deux tailles de texte imprimé (compacte, titre de
  fiche).
- Soulignement : épaisseur et écart sous le texte (fins, pour ne pas
  alourdir la lecture).
- Espacements : une petite échelle (intérieur de ligne, écart entre blocs de
  la fiche).

## Accessibilité

- **Fiche** : `<article>` ; le texte du nœud en `<h1>` masqué à l'écran (lu
  par les lecteurs d'écran ; à l'écran, il est la valeur Text) ; les trois
  groupes en `<dl>` ; le fil d'Ariane en
  `<nav aria-label="Sections">` avec une `<ol>` ; les champs en `<dl>` ;
  l'emphase en `<em>`.
- **Compacte** : élément d'une liste ordonnée (l'ordre du document a un
  sens) ; structure exacte (liste emboîtée ou `tree`) au sprint 5.
- Le texte imprimé porte `lang="fr"`, quelle que soit la langue de
  l'interface.
- Compacte : la couleur n'est jamais seule à dire le libellé, son nom est
  écrit sous le trait (`lang="en"`) et les lecteurs d'écran le lisent avant
  le champ.
- Contraste AA : 4,5:1 pour tout texte, atténué compris ; 3:1 pour les
  soulignements contre le fond ; focus toujours visible.

## À faire / à éviter

| À faire | À éviter |
|---|---|
| garder le texte de numrev tel quel | corriger, réordonner ou compléter le texte |
| souligner les champs, sans toucher au texte | changer la couleur ou la graisse du texte imprimé |
| montrer le contexte à part, atténué | compter le contexte dans la sélection |
| dire « unknown page » quand il n'y a pas d'ancre | cacher la ligne source |
