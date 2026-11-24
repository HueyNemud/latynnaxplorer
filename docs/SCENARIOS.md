# Scénarios de requête

Chaque scénario décrit ce qu'un utilisateur demande et ce qu'il obtient ;
il donne un critère de la requête (`lib/query/`) et au moins un test.

Tous les critères sont facultatifs et se combinent (conjonction), sans cas
particulier ; un critère absent ne filtre rien, et sans aucun critère tout
est sélectionné. Le résultat
contient tout ce que la requête désigne, quel que soit le type de nœud :
`lib/query/` fait confiance aux données et ne juge pas de la pertinence.

## 1. Un nœud et tout son sous-arbre

**Demande** : le contenu complet d'une rubrique, dans l'ordre de lecture ;
ou de plusieurs rubriques à la fois (les cases des facettes).

**URL** : `?subtree=<uuid>`, répétable : `?subtree=<a>&subtree=<b>` donne
l'union des deux sous-arbres (en conjonction avec les autres critères).

**Résultat** : le sous-graphe induit par le nœud désigné et tous ses
descendants, récursivement (sous-rubriques, entrées, éléments hors champ) ;
avec plusieurs nœuds, l'union de leurs sous-arbres, chaque nœud une fois
même si deux nœuds désignés sont l'un sous l'autre.

- Le nœud désigné fait partie du résultat.
- Nœuds dans l'ordre de lecture.
- À part du résultat, le **contexte** (`context`) : les rubriques ancêtres
  du nœud désigné, de la racine à son parent (avec plusieurs nœuds :
  celles de chacun, une fois chacune). Il entoure la sélection sans en
  faire partie.
- Le nœud peut être de n'importe quel type : une entrée donne un résultat
  réduit à elle-même.

**Erreurs** : uuid absent ou mal formé, même parmi d'autres (requête
invalide) ; uuid d'aucun volume, même à côté d'uuid connus. Une valeur
répétée est lue une fois.

**Tests** : `lib/query/query.test.ts`, `lib/query/resolve.test.ts`,
`lib/query/explore.test.ts`.

## 2. Les nœuds qui contiennent un texte

**Demande** : tous les passages des annuaires qui mentionnent un nom, une
activité, une rue.

**URL** : `?text=<texte>`, et `in=<zone>` (répétable) pour ne chercher
que dans certaines zones ; avec `subtree`, la recherche est restreinte à
ce sous-arbre (conjonction des critères). Le formulaire de recherche
(`components/SearchForm.tsx`) envoie `text` et les zones enfoncées ; avec
les facettes, il envoie aussi les rubriques cochées.

**Résultat** : les nœuds de tout type dont le texte contient le texte
cherché, comme une phrase entière, sans tenir compte des accents ni de la
casse.

- Pas de tolérance aux fautes : « Lefevre » ne trouve pas « Lefebvre »
  (`docs/IDEES.md`, « Recherche tolérante »).
- Zones : `subj`, `desc`, `addr` (les empans de ce libellé) et `other`
  (le texte hors empan : rubriques, éléments hors champ, quelques signes
  des entrées). Avec des zones, la phrase doit tenir dans un empan d'une
  zone demandée, ou dans un morceau hors empan pour `other` : une phrase
  à cheval sur deux morceaux (« Dupont, rue ») n'est trouvée que dans
  tout le texte. Aucune zone ou toutes : tout le texte. Sans texte, `in`
  est ignoré.
- Blancs en tête et en fin retirés, blancs intérieurs réduits à une
  espace ; un texte vide ne filtre rien (un formulaire vide envoie
  `text=`).
- Nœuds et ordre comme au scénario 1 ; une sélection vide n'est pas
  une erreur.
- Contexte : les rubriques ancêtres des résultats qui n'en font pas
  partie, chacune une fois, dans l'ordre de lecture. Vide sans résultat.
- Sans rubrique, la recherche porte sur tous les volumes : ils sont tous
  chargés.

**Erreurs** : `text` répété ; zone inconnue ; avec `subtree`, celles du
scénario 1 (un `subtree` inconnu reste une erreur, même sans résultat).

**Tests** : `lib/query/query.test.ts`, `lib/query/resolve.test.ts`,
`lib/query/fold.test.ts`.
