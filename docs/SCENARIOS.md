# Scénarios de requête

Chaque scénario décrit ce qu'un utilisateur demande et ce qu'il obtient.
Il donne un filtre de `lib/query/` et au moins un test. Les filtres doivent
pouvoir se combiner : un scénario n'est pas une fonction à part.

Tous les critères sont facultatifs ; ceux qui sont présents se combinent
(conjonction), sans cas particulier. Sans aucun critère, rien n'est
sélectionné : la vue le dit (« Nothing to show »). Chaque point d'entrée de l'interface (lien
d'un nœud, champ de recherche) commence une nouvelle sélection.

Principe : sans filtre explicite, le résultat contient tout ce que la
requête désigne, quel que soit le type de nœud. `lib/query/` fait
confiance aux données et ne décide pas de ce qui est pertinent.

## 1. Un nœud et tout son sous-arbre

**Demande** : le contenu complet d'une rubrique, dans l'ordre de lecture ;
ou de plusieurs rubriques à la fois (facettes de structure,
`docs/DESIGN.md`).

**URL** : `?subtree=<uuid>`, répétable : `?subtree=<a>&subtree=<b>` donne
l'union des deux sous-arbres (union dans une facette, conjonction avec les
autres critères).

**Résultat** : le sous-graphe induit par le nœud désigné et tous ses
descendants, récursivement (sous-rubriques, entrées, éléments hors champ) ;
avec plusieurs nœuds, l'union de leurs sous-arbres, chaque nœud une fois
même si deux nœuds désignés sont l'un sous l'autre.

- Le nœud désigné fait partie du résultat.
- Nœuds triés par ordre de lecture (`document_reading_order`).
- Arcs `member_of`, `child_of` et `follows` dont les deux bouts sont dans
  le résultat ; `follows` relie une entrée à l'entrée suivante du volume,
  seulement si celle-ci est aussi dans le résultat.
- Un nœud porte `id`, `kind`, `parentId`, `documentReadingOrder`, `text`,
  ses empans (`spans`, dans l'ordre du texte) et ses ancres (`anchors`,
  dans l'ordre des pages).
- À part du résultat, le **contexte** (`context`) : les rubriques ancêtres
  du nœud désigné, de la racine à son parent (avec plusieurs nœuds :
  celles de chacun, une fois chacune). Il entoure la sélection sans en
  faire partie.
- Le nœud peut être de n'importe quel type : une entrée donne un résultat
  réduit à elle-même.

**Erreurs** : uuid absent ou mal formé, même parmi d'autres (requête
invalide) ; uuid inconnu de la base, même à côté d'uuid connus. Une valeur
répétée est lue une fois.

**Mesure** (1807) : les 43 rubriques de premier niveau ensemble
(22 068 nœuds) en 11 ms pour la sélection seule en SQL.

**Tests** : `lib/query/query.test.ts`, `lib/query/resolve.test.ts`.

## 2. Les nœuds qui contiennent un texte

**Demande** : tous les passages de l'annuaire qui mentionnent un nom, une
activité, une rue.

**URL** : `?text=<texte>` ; avec `subtree`, la recherche est restreinte à
ce sous-arbre (conjonction des deux critères). Le champ de recherche
(`components/SearchForm.tsx`) envoie `text` seul : il cherche dans tout
l'annuaire. Avec les facettes, il envoie aussi les rubriques cochées.

**Résultat** : les nœuds de tout type dont le texte contient le texte
cherché, comme une phrase entière, sans tenir compte des accents ni de la
casse.

- Pas de tolérance aux fautes : « Lefevre » ne trouve pas « Lefebvre ».
  La recherche floue par trigrammes, essayée sur 1807, ramenait trop de
  bruit (« paix » trouvait « Paille ») ; voir `docs/IDEES.md`.
- `%`, `_` et `\` sont pris à la lettre.
- Blancs en tête et en fin retirés, blancs intérieurs réduits à une
  espace ; un texte vide ne filtre rien (un formulaire vide envoie
  `text=`).
- Nœuds, arcs et ordre comme au scénario 1 ; une sélection vide n'est pas
  une erreur.
- Contexte : les rubriques ancêtres des résultats qui n'en font pas
  partie, chacune une fois, dans l'ordre de lecture. Vide sans résultat.
- Servi par l'index trigrammes de `node.text`, puis restreint au
  sous-arbre s'il est donné (raison dans `lib/query/resolve.ts`). Sur
  1807, `resolve` : « rue de la Paix » (8 nœuds) 1 à 2 ms, « rue »
  (17 402) 175 ms ; `context` en parallèle : 2 ms et 105 ms.

**Erreurs** : `text` répété ; avec `subtree`, celles du scénario 1 (un
`subtree` inconnu reste une erreur, même sans résultat).

**Tests** : `lib/query/query.test.ts`, `lib/query/resolve.test.ts`.
