# Idées futures

Pistes notées, **non retenues pour l'instant** : rien ici n'est à faire sans
décision explicite. Une idée adoptée passe dans `docs/DECISIONS.md`.

## Performances en lecture

Toutes changent le modèle de données. Mesures de référence : section 4 de
`docs/MODELE_DONNEES.md` (1807, cache chaud). Aujourd'hui, toutes les
requêtes types passent sous 30 ms, sauf les arcs de tout le volume (98 ms,
22 ms pour `follows` par `lead()`) et le sous-arbre des plus grosses
rubriques par `lib/query/` (70 à 80 ms pour 13 737 nœuds). À reconsidérer
avec les requêtes réelles de `lib/query/` ou plusieurs volumes en base.

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
  seule recherche d'index, sans `WITH RECURSIVE` ; le parcours récursif
  coûte de quelques millisecondes à ≈ 17 ms pour le plus gros sous-arbre
  (13 737 nœuds, une recherche d'index par nœud ; profondeur maximale 7).
- Coût : une donnée dérivée de `parent_id` ; `ltree` serait une extension
  de plus.

### Table de fermeture des sections

- Table `section_closure (ancestor_id, descendant_id)`, clé primaire sur les
  deux, une ligne par section et chacune de ses sections descendantes (elle
  comprise), remplie à l'import ou vue matérialisée rafraîchie après
  l'import. Sous-arbre d'un nœud : ses sections descendantes, puis les
  nœuds dont le parent est l'une d'elles (index `parent_id`).
- Exacte par construction, quel que soit l'ordre de lecture : ne dépend
  d'aucune hypothèse sur les données.
- Mesuré sur 1807 (table temporaire) : 1 517 lignes ; plus gros sous-arbre
  6,7 ms contre 15 à 17 ms pour la récursion, sans compter l'entrée suivante
  de chaque entrée (≈ 40 ms par sous-requête, à traiter à part).
- Coût : une table dérivée de `parent_id`, à recalculer à chaque import.

### Rubriques d'un seul tenant : sous-arbre = plage de rangs

- Hypothèse : par construction (des livres), le contenu d'une rubrique se
  suit dans l'ordre de lecture, sans rien d'autre intercalé. Vérifiée sur
  les 603 rubriques de 1807, mais à confirmer dans numrev avant de s'y fier.
- Colonne `node.subtree_end` (rang du dernier nœud du sous-arbre), calculée
  et vérifiée à l'import (échec si l'hypothèse est fausse). Sous-arbre =
  `document_reading_order BETWEEN rang AND subtree_end`, servi par l'index
  unique existant ; `follows` = entrées consécutives du résultat.
- Mesuré sur 1807 : plus gros sous-arbre 3,4 ms contre 70 à 80 ms pour la
  requête actuelle.
- Coût : une colonne de plus, et une hypothèse sur numrev dans le modèle.
