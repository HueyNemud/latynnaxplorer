# Idées futures

Pistes notées, **non retenues pour l'instant** : rien ici n'est à faire sans
décision explicite. Une idée adoptée passe dans `docs/DECISIONS.md` et sort
d'ici.

## Pagination de la vue Liste

- Tout est rendu aujourd'hui. « Listes particulières » (13 737 lignes) :
  environ 3 s, dont 2,1 s de style et de mise en page (23 éléments du DOM
  par ligne) ; la requête, elle, prend 13 ms. Seules 3 rubriques sur 603
  dépassent 1 000 nœuds, mais All coche tout le volume (22 068 lignes).
- Pistes : paginer, ou `content-visibility: auto` en CSS. Virtualisation
  déconseillée (dépendance, mal accordée aux groupes emboîtés, Ctrl+F
  cassé).

## Plusieurs volumes

- Une recherche sans rubrique, ou une URL dont un nœud n'est dans aucun
  volume chargé, télécharge tous les volumes (1,3 Mo compressés pour 1807,
  sans doute bien plus pour les annuaires de la fin du siècle). Si les
  volumes se multiplient : un index commun, statique lui aussi (nœud →
  volume ; mots → volumes), pour ne charger que les volumes concernés.
- Volumes très gros : Parquet, lu par colonnes, plutôt que JSON.

## Poids de l'arbre des rubriques

- Contents rend l'arbre entier du volume regardé (603 rubriques, branches
  repliées comprises). Si un volume en a beaucoup plus : ne rendre que les
  branches dépliées.

## Recherche tolérante

- La recherche est exacte. Mesuré sur 1807 : la similarité par trigrammes
  ramène trop de bruit (« paix » → Paille, Paillard) et rate encore des
  graphies (« lefevre » / « Lefebvre ») ; un plein texte classique n'a
  aucune tolérance aux graphies et racinise mal le français ancien.
- À reprendre si les variantes de graphie manquent : élargir chaque mot
  cherché à ses variantes proches, sur la liste des mots distincts du
  volume (calculée à l'export ou au chargement).

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

- Arcs entre entrées d'éditions successives, tirés de la jointure numrev
  `<A>__<B>.<méthode>.join.csv` (colonnes `methode`, `certitude`,
  `niveau_incertitude`, `score`), dans un fichier par paire d'éditions ;
  seules les paires appariées ?
- numrev apparie aussi les rubriques entre éditions (cas 1-N) : arcs
  temporels entre sections, à part.
- « Voisins temporels » et « composante » (lignée) par parcours de ces arcs
  jusqu'au point fixe (`docs/MODELE_DONNEES.md`, « Plus tard »).

## Écartées : analyse dans le site

Le site sert à explorer, sélectionner et exporter ; l'analyse revient aux
historiens, à partir de l'export.

- **Mesurer** : effectifs par rubrique, rue ou période.
- **Relier** des individus : associés, renvois « *Voyez* », occupants d'une
  même adresse.

## Fiches de composant

- `docs/composants/noeud-liste.md` et `facettes.md` (près de 300 lignes
  chacune) n'ont pas été relues lors de l'audit du code : les resserrer de
  la même façon, sur un état présent sans redites avec le code.
