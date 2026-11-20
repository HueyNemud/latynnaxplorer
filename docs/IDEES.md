# Idées futures

Pistes notées, **non retenues pour l'instant** : rien ici n'est à faire sans
décision explicite. Une idée adoptée passe dans `docs/DECISIONS.md` et sort
d'ici.

## Pagination de la vue Liste

- Tout est rendu aujourd'hui. « Listes particulières » (13 737 nœuds), en
  production : 25,8 Mo (1,86 Mo compressés), 1,2 s côté serveur ; le poids
  vient des lignes et de leur copie dans le flux RSC. Seules 3 rubriques sur
  603 dépassent 1 000 nœuds, mais All coche tout le volume (22 068 lignes).
- Pistes : paginer, ou `content-visibility: auto` en CSS. Virtualisation
  déconseillée (dépendance, mal accordée aux groupes emboîtés, Ctrl+F
  cassé).

## Performances en lecture

Toutes changent le modèle ; à reconsidérer avec plusieurs volumes en base.
Aujourd'hui, le plus gros sous-arbre se lit en 7,6 ms en SQL (mesures :
`docs/MODELE_DONNEES.md`, section 4).

- **Texte sans accents précalculé** : colonnes générées
  `immutable_unaccent(...)`, indexées ; environ 15 % de moins sur les
  recherches.
- **Rubriques d'un seul tenant** : si numrev garantit que le contenu d'une
  rubrique se suit dans l'ordre de lecture (vrai sur 1807), une colonne
  `subtree_end` ferait d'un sous-arbre une plage de rangs (3,4 ms contre
  7,6).

## Poids de l'arbre des rubriques

- Contents rend l'arbre entier du volume (603 rubriques, branches repliées
  comprises). Si les volumes se multiplient : ne rendre que les branches
  dépliées, ou charger l'arbre du seul volume regardé.

## Recherche tolérante

- La recherche est exacte. Mesuré sur 1807 : la similarité par trigrammes
  ramène trop de bruit (« paix » → Paille, Paillard) et rate encore des
  graphies (« lefevre » / « Lefebvre ») ; le plein texte de PostgreSQL n'a
  aucune tolérance aux graphies et racinise mal le français ancien.
- À reprendre si les variantes de graphie manquent : plein texte pour la
  structure de la requête, `pg_trgm` pour élargir chaque mot à ses
  variantes, sur une table des mots distincts calculée à l'import.

## Facettes sur écran étroit

- Les panneaux ouverts prennent 34,5 rem : sur un téléphone, ils devraient
  passer par-dessus la vue (tiroir), repliés par défaut.

## Mode sombre

- Chaque échelle de couleurs de Radix a sa variante sombre : un mode sombre
  coûterait peu.

## Affichage

- Surligner les correspondances d'une recherche dans les lignes, distinct
  du fond des champs.
- Choix de densité (serré, normal, aéré) et réglage des fonds de champs
  (par exemple ne surligner que les sujets), mémorisés.
- En-tête de colonnes fixé au défilement, en tête de la pile des titres.
- Sélection multiple de quelques entrées et actions groupées : à discuter
  avec l'export.

## Tests de rendu des composants

- La logique des facettes est testée en fonctions pures ; le rendu ne l'est
  que par des captures. Des tests de rendu (Testing Library, ou Vitest en
  mode navigateur) demanderaient une dépendance.

## Internationalisation de l'interface

- Interface en anglais ; d'autres langues plus tard (bibliothèque ou non,
  langue dans l'URL ou préférence du navigateur). Le texte des annuaires
  n'est jamais traduit.

## Liens temporels

- Arcs entre entrées d'éditions successives, importés de la jointure numrev
  `<A>__<B>.<méthode>.join.csv` (colonnes `methode`, `certitude`,
  `niveau_incertitude`, `score`) ; seules les paires appariées ?
- numrev apparie aussi les rubriques entre éditions (cas 1-N) : arcs
  temporels entre sections, dans une table à part.
- « Voisins temporels » et « composante » par `WITH RECURSIVE` (SQL esquissé
  dans `docs/MODELE_DONNEES.md`).

## Écartées : analyse dans le site

Le site sert à explorer, sélectionner et exporter ; l'analyse revient aux
historiens, à partir de l'export.

- **Mesurer** : effectifs par rubrique, rue ou période.
- **Relier** des individus : associés, renvois « *Voyez* », occupants d'une
  même adresse.
