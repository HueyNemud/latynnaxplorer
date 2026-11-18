# Idées futures

Pistes notées, **non retenues pour l'instant** : rien ici n'est à faire sans
décision explicite. Une idée adoptée passe dans `docs/DECISIONS.md`.

## Performances en lecture

Toutes changent le modèle de données. Mesures de référence : section 4 de
`docs/MODELE_DONNEES.md` (1807, cache chaud). Aujourd'hui, toutes les
requêtes types passent sous 30 ms en SQL ; le plus gros sous-arbre par
`lib/query/` en prend 7,6. À reconsidérer avec d'autres scénarios ou
plusieurs volumes en base.

### Texte sans accents précalculé

- Colonnes générées `STORED` `immutable_unaccent(node.text)` et
  `immutable_unaccent(span.normalized)`, indexées à la place des index
  d'expression.
- Gain mesuré : ≈ 15 % de moins sur la revérification des recherches floues
  (ADDR ~ « rue de la Paix » : 14,3 → 12,0 ms).
- Coût : deux colonnes de plus, et des requêtes qui doivent les nommer.

### Chemin des ancêtres

- Sur chaque nœud, la liste de ses sections ancêtres (tableau `uuid[]` avec
  index GIN, ou `ltree` avec index GiST), calculée à l'import.
- Dépassé pour l'instant : `parent_closure` (adoptée, voir
  `docs/DECISIONS.md`) donne déjà sous-arbre et ancêtres sans
  `WITH RECURSIVE`.
- Coût : une donnée dérivée de `parent_id` ; `ltree` serait une extension
  de plus.

### Rubriques d'un seul tenant : sous-arbre = plage de rangs

- Hypothèse : par construction (des livres), le contenu d'une rubrique se
  suit dans l'ordre de lecture, sans rien d'autre intercalé. Vérifiée sur
  les 603 rubriques de 1807, mais à confirmer dans numrev avant de s'y fier.
- Colonne `node.subtree_end` (rang du dernier nœud du sous-arbre), calculée
  et vérifiée à l'import (échec si l'hypothèse est fausse). Sous-arbre =
  `document_reading_order BETWEEN rang AND subtree_end`, servi par l'index
  unique existant ; `follows` = entrées consécutives du résultat.
- Mesuré sur 1807 : lire les 13 737 lignes du plus gros sous-arbre par
  plage prend 3,4 ms (requête actuelle, avec `parent_closure` et
  `next_entry_id` : 7,6 ms).
- Coût : une colonne de plus, et une hypothèse sur numrev dans le modèle.

## État de la requête dans le navigateur : `nuqs`

- Prévu par le brief, reporté au sprint 3 (`docs/DECISIONS.md`) : rien ne
  modifie encore la requête côté client.
- À reprendre avec l'opération « filtrer » ; trancher alors entre `nuqs`
  à la place de `parseQuery` / `serializeQuery` (`lib/query/query.ts`) ou
  `nuqs` qui s'appuie sur eux.

## Écartées : analyse dans le site

Le site permet d'explorer les sorties de numrev, pas d'en faire l'analyse
(`docs/DESIGN.md`, « Explorer, pas analyser ») ; l'export de la sélection
couvre le besoin des historiens qui analysent eux-mêmes.

- **Mesurer** : effectifs par rubrique, rue ou période ; « synthèse »
  comme densité compacte d'un sous-graphe.
- **Relier** des individus : associés, renvois « *Voyez* » comme arcs,
  occupants d'une même adresse comme réseau.
