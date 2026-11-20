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

## Pagination de la vue Liste

- Sprint 5 : tout est rendu, même le plus gros sous-arbre de 1807
  (13 737 nœuds). Gardé en connaissance de cause après mesure.
- Mesures du sprint 5 (serveur de production, en local) : Postes
  (303 nœuds) 1,9 Mo, 0,1 s ; « Liste de non-commerçans » (3 337) 13,8 Mo,
  0,8 s ; « Listes particulières » (13 736) 66 Mo de HTML (13 Mo
  compressé), 5 s côté serveur, premier affichage à 4,6 s et chargement à
  9,5 s dans Chromium, 596 000 éléments, 306 Mo de mémoire JS. Seules 3
  rubriques sur 602 dépassent 1 000 nœuds, mais la plus grosse est à un
  clic (« Open » d'une carte de contexte).
- Répartition du poids : 46 Mo de charge RSC (copie sérialisée de l'arbre
  rendu, pour l'hydratation), 13,7 Mo de fiches repliées, le reste en
  lignes. Rendre la fiche au premier dépliage (composant client et route)
  diviserait le poids par 3 environ : insuffisant seul.
- À reprendre si le rendu devient lent (plusieurs volumes, sélections plus
  larges) : paginer, ou `content-visibility: auto` en CSS. La
  virtualisation est déconseillée (une dépendance, mal accordée aux groupes
  emboîtés, Ctrl+F cassé).
- Sprint d'optimisation envisagé puis écarté (19 novembre, sprint 6) : la
  lenteur ressentie venait du serveur de développement. Mesures : Libraires
  (280 nœuds) 3,4 s en `pnpm dev`, 0,14 s en production ; Épiciers (759)
  9,1 s contre 0,31 s jusqu'au premier affichage ; page d'Épiciers 3,5 Mo
  en production, dont 70 % de charge RSC et 0,7 Mo de fiches repliées.
  Leviers notés : moins d'éléments par ligne, coût de `next/link`, fiche
  rendue au premier dépliage (un peu de JavaScript), `content-visibility`.

## Poids de l'arbre des rubriques

- Sprint 8 : Contents rend l'arbre entier du volume au focus (603
  rubriques de 1807, branches repliées comprises) et passe toutes les
  rubriques au composant client. Page par défaut (une entrée) : 415 Ko,
  69 Ko compressés, dont 272 Ko de HTML pour l'arbre et environ 119 Ko de
  données ; 53 ms en production.
- Pistes si les volumes se multiplient : ne rendre que les branches
  dépliées (le reste au dépliage), ne passer au client que les données (et
  rendre l'arbre côté client seulement), ou charger l'arbre d'un volume au
  focus seulement.

## Facettes sur écran étroit

- Les panneaux ouverts prennent 34,5 rem : sur un téléphone, ils devraient
  passer par-dessus la vue (tiroir), repliés par défaut. À concevoir.

## Tests de rendu des composants

- Sprint 9 : la logique des facettes est testée en fonctions pures ; le
  rendu des composants ne l'est que par les captures avant / après.
- Des tests de rendu (Testing Library et jsdom, ou Vitest en mode
  navigateur) demanderaient une dépendance ; à discuter si les composants
  se multiplient.

## Recherche tolérante

Sprint 7 : la recherche par texte est exacte (sans accents ni casse).
Mesures sur 1807, avant ce choix :

- Similarité par trigrammes (`<%`, seuil 0,6) : « paix » trouve aussi
  Paille, Paillard, Paignon (102 nœuds contre 59) ; sur une phrase,
  « rue de la paix » donne 1 682 nœuds (8 exacts), mot par mot 18.
  « lefevre » ne trouve pas « Lefebvre » (similarité 0,55) ; au seuil
  0,5, si, mais « boulanger » passe de 26 à 89 nœuds.
- Plein texte de PostgreSQL (`tsvector`, configuration `french`) : des
  mots plutôt que des morceaux, recherche de phrase, syntaxe de saisie
  (`websearch_to_tsquery`) ; mais aucune tolérance aux graphies, et une
  racinisation moderne incohérente ici (« boulanger » → `boulang`,
  « boulangers » → `boulanger` : 11 et 4 nœuds). Changerait le modèle
  (configuration avec `unaccent`, index GIN de plus).
- Combinaison usuelle, à reprendre si les variantes de graphie manquent :
  plein texte pour la structure de la requête, `pg_trgm` pour élargir
  chaque mot à ses variantes, sur une table des mots distincts du corpus
  calculée à l'import.

## Pistes tirées d'un guide des tables de données

Source : pencilandpaper.io, « UX pattern analysis: enterprise data tables ».

- **Surligner les correspondances** d'une recherche dans les lignes (avec la
  recherche du sprint 7), distinct du fond des champs.
- **Sélection multiple et actions groupées** (exporter quelques entrées) :
  touche au modèle de sélection, à discuter avec l'export (sprint 10).
- **Choix de densité** (serré, normal, aéré), hors de la liste et mémorisé.
- **En-tête de colonnes fixé** au défilement, en tête de la pile des titres.

## Réglages d'affichage des champs

- Sprint 6 : les trois champs (sujet, description, adresse) restent
  surlignés, aux couleurs du sprint 5 ; des fonds plus pâles ont été
  essayés et écartés.
- Plus tard : un réglage pour afficher ou masquer la couleur de chaque
  champ (par exemple ne surligner que les sujets), mémorisé, à côté du
  choix de densité.

## État de la requête dans le navigateur : `nuqs`

- Prévu par le brief, reporté au sprint 3 (`docs/DECISIONS.md`) : rien ne
  modifie encore la requête côté client.
- À reprendre avec l'opération « filtrer » ; trancher alors entre `nuqs`
  à la place de `parseQuery` / `serializeQuery` (`lib/query/query.ts`) ou
  `nuqs` qui s'appuie sur eux.
- Sprint 7 : la recherche passe par un formulaire GET natif, sans script ;
  `nuqs` reste inutile tant qu'aucun critère ne change sans recharger la
  page (recherche à la frappe, facettes interactives).

## Internationalisation de l'interface

- Interface en anglais par défaut (sprint 4) ; d'autres langues plus tard.
- À trancher le moment venu : bibliothèque (ou non), langue dans l'URL ou
  préférence du navigateur. Le texte des annuaires n'est jamais traduit.

## Écartées : analyse dans le site

Le site sert à explorer, sélectionner et exporter le contenu des annuaires
(`docs/DESIGN.md`, « Objectif ») ; l'analyse revient aux historiens, à
partir de l'export.

- **Mesurer** : effectifs par rubrique, rue ou période ; « synthèse »
  comme densité compacte d'un sous-graphe.
- **Relier** des individus : associés, renvois « *Voyez* » comme arcs,
  occupants d'une même adresse comme réseau.
