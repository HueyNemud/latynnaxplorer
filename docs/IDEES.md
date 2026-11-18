# Idées futures

Pistes notées, **non retenues pour l'instant** : rien ici n'est à faire sans
décision explicite. Une idée adoptée passe dans `docs/DECISIONS.md`.

## Performances en lecture

Toutes changent le modèle de données. Mesures de référence : section 4 de
`docs/MODELE_DONNEES.md` (1807, cache chaud). Aujourd'hui, toutes les
requêtes types passent sous 30 ms, sauf les arcs de tout le volume (98 ms,
22 ms pour `follows` par `lead()`). À reconsidérer avec les requêtes réelles
de `lib/query/` ou plusieurs volumes en base.

### `follows` stocké

- Vue matérialisée `follows (source, target)`, recalculée à l'import par
  `lead()`, ou colonne `node.next_entry_id`, indexée des deux côtés.
- Gain mesuré : arcs de tout le volume ≈ 16 ms (contre 98 ms, ou 22 ms par
  `lead()`), de la plus grosse rubrique ≈ 11 ms (contre 29 ms).
- Coût : une donnée dérivée à tenir à jour ; revient sur la décision
  « `follows` calculé, non stocké ».

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
- Gain attendu (non mesuré) : contenu d'une rubrique et ancêtres en une
  seule recherche d'index, sans `WITH RECURSIVE` ; le parcours récursif ne
  coûte aujourd'hui que quelques millisecondes (profondeur maximale 7).
- Coût : une donnée dérivée de `parent_id` ; `ltree` serait une extension
  de plus.
