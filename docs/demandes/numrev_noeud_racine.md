# Demande à numrev : un vrai nœud racine par volume

Prompt destiné à un agent qui travaille dans `../adresses_revolutionnaires`
(numrev). Rédigé le 2026-11-19 depuis latynnaxplorer.

---

## Contexte

Le projet voisin `../latynnaxplorer` (site d'exploration des annuaires)
importe le livrable de `numrev export` en lecture seule, sans rien corriger :
numrev fait foi. Une sélection y est toujours **un nœud et tout son
sous-arbre** (rubrique, entrée ou élément hors champ, avec tous ses
descendants), éventuellement restreinte par d'autres critères, comme une
recherche dans le texte. Pour chercher dans tout un annuaire, il faut donc
un nœud dont tout le volume descend.

## Constat

`docs/format_export.md` décrit `root` comme « l'identifiant de la racine de
l'arbre des titres » (`00000000-0000-0000-0000-000000000000`). Mais cette
racine n'est pas un nœud :

- elle n'est pas dans `titles` : elle n'a ni texte, ni intitulé, ni plage ;
- son identifiant est le même pour tous les volumes : il ne peut pas
  désigner un volume une fois plusieurs volumes chargés ensemble.

latynnaxplorer importe donc les enfants de `root` comme des nœuds sans
parent. Dans l'export de 1807 (`1807_AD75-PER292`, exporté le 2026-10-30),
cela fait 133 racines : 43 titres de premier niveau (« LISTES
PARTICULIÈRES… », « NOTAIRES. », « ERRATA. »…) et 90 éléments hors champ.
Une recherche ne peut porter, au plus, que sur l'une de ces rubriques.

## Demande

1. Faire de la racine de chaque volume un vrai titre de `titles` : un uuid
   propre au volume (stable d'un export à l'autre, par exemple dérivé de
   l'identifiant du volume), le seul titre sans parent (`parent: null`).
2. Lui donner un intitulé (`heading`, `text`) qui nomme le volume, par
   exemple son titre : à numrev de dire d'où il vient (métadonnées du
   volume, page de titre). Il n'a pas de ligne dans le document : `lines`
   vide, `range` et `pages` à définir (vides, ou tout le volume).
3. Garder les autres règles : les titres de premier niveau, et les entrées
   ou éléments hors champ qui précèdent tout titre de leur plage, ont pour
   parent cette racine.
4. Mettre `docs/format_export.md` à jour (champ `root`, valeur `null` de
   `parent`), et dire si le schéma (`numrev-structure/2`) change de
   version.

latynnaxplorer n'a rien contourné : en attendant un nouvel export, on ne
cherche que dans une rubrique de premier niveau au plus. À réception,
l'import y rangera la racine comme un nœud ordinaire.
