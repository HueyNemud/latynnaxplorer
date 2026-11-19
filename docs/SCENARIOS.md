# Scénarios de requête

Chaque scénario décrit ce qu'un utilisateur demande et ce qu'il obtient.
Il donne un filtre de `lib/query/` et au moins un test. Les filtres doivent
pouvoir se combiner : un scénario n'est pas une fonction à part.

Principe : sans filtre explicite, le résultat contient tout ce que la
requête désigne, quel que soit le type de nœud. `lib/query/` fait
confiance aux données et ne décide pas de ce qui est pertinent.

## 1. Un nœud et tout son sous-arbre

**Demande** : le contenu complet d'une rubrique, dans l'ordre de lecture.

**URL** : `?subtree=<uuid>`.

**Résultat** : le sous-graphe induit par le nœud désigné et tous ses
descendants, récursivement (sous-rubriques, entrées, éléments hors champ).

- Le nœud désigné fait partie du résultat.
- Nœuds triés par ordre de lecture (`document_reading_order`).
- Arcs `member_of`, `child_of` et `follows` dont les deux bouts sont dans
  le résultat ; `follows` relie une entrée à l'entrée suivante du volume,
  seulement si celle-ci est aussi dans le résultat.
- Un nœud porte `id`, `kind`, `parentId`, `documentReadingOrder`, `text`,
  ses empans (`spans`, dans l'ordre du texte) et ses ancres (`anchors`,
  dans l'ordre des pages).
- À part du résultat, le **contexte** (`context`) : les rubriques ancêtres
  du nœud désigné, de la racine à son parent. Il entoure la sélection sans
  en faire partie.
- Le nœud peut être de n'importe quel type : une entrée donne un résultat
  réduit à elle-même.

**Erreurs** : uuid absent ou mal formé, paramètre répété (requête
invalide) ; uuid inconnu de la base.

**Tests** : `lib/query/query.test.ts`, `lib/query/resolve.test.ts`.

## 2. Les nœuds d'un sous-arbre qui contiennent un texte

**Demande** : dans une rubrique, tous les passages qui mentionnent un nom,
une activité, une rue.

**URL** : `?subtree=<uuid>&text=<texte>`. On cherche toujours dans un
sous-arbre : `text` restreint le scénario 1, il ne s'emploie pas seul.

**Résultat** : les nœuds du sous-arbre, de tout type, dont le texte
contient le texte cherché, comme une phrase entière, sans tenir compte des
accents ni de la casse.

- Pas de tolérance aux fautes : « Lefevre » ne trouve pas « Lefebvre ».
  La recherche floue par trigrammes, essayée sur 1807, ramenait trop de
  bruit (« paix » trouvait « Paille ») ; voir `docs/IDEES.md`.
- `%`, `_` et `\` sont pris à la lettre.
- Blancs en tête et en fin retirés, blancs intérieurs réduits à une
  espace ; un texte vide ne filtre rien (un formulaire vide envoie
  `text=`).
- Nœuds, arcs, ordre et contexte comme au scénario 1 ; une sélection vide
  n'est pas une erreur.
- Servi par l'index trigrammes de `node.text`, puis restreint au
  sous-arbre (raison dans `lib/query/resolve.ts`). Dans la plus grosse
  rubrique de 1807, `resolve` en entier : « rue de la Paix » 2 ms,
  « rue » (11 296 nœuds) 120 ms.

**Erreurs** : celles du scénario 1, plus `text` répété ; un `subtree`
inconnu reste une erreur, même sans résultat.

**Tests** : `lib/query/query.test.ts`, `lib/query/resolve.test.ts`.
