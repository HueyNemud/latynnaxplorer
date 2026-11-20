# Essai : données en local

Question : servir chaque volume en fichier et résoudre les requêtes dans le
navigateur, plutôt que par PostgreSQL et le rendu serveur, est-il plus
rapide ? L'essai vit à côté de la page `/`, sans la changer :

- `scripts/export-volume.ts` : `public/volumes/<volume>.json`, tiré des
  mêmes lignes que l'import en base (hors Git, comme `data/`) ;
- `lib/local/engine.ts` : sélection, contexte, facettes et fiche en
  fonctions pures, de même sémantique que `lib/query/` ;
- `/essai` (`components/LocalExplorer.tsx`) : la page d'exploration,
  résolue dans le navigateur ; l'URL suit coches et recherche par l'API
  History, sans requête au serveur après l'arrivée.

## Exactitude

Les deux versions rendent le même résultat : tests sur la fixture
(`lib/local/engine.test.ts`), et `scripts/compare-local.ts` sur 1807 : 1 371
comparaisons (chaque rubrique, All, 18 recherches seules et dans les trois
plus grosses rubriques, décomptes des facettes), aucune différence.

Recherche : le pliage reproduit `unaccent` pour l'imprimé français (NFKD,
ligatures, tirets, guillemets) ; sur 1807, seuls æ, œ, Œ et — demandaient
plus que NFKD. Les autres règles d'`unaccent` (833 au-delà de NFD : pleine
chasse, unités…) se généreraient depuis son fichier de règles.

## Mesures (20/11/2026)

Build de production, Chromium 157 sans cache de navigation, une machine de
développement, base locale ; médiane de 3. Temps jusqu'à la vue affichée
(toutes ses lignes, puis une image), délai de 300 ms des coches déduit.
« 4G rapide » : 9 Mbit/s, 60 ms de latence.

| Cas (lignes) | `/` local | `/` 4G | `/essai` local | `/essai` 4G |
|---|---|---|---|---|
| Arrivée à froid sur Épiciers (761) | 0,45 s, 0,7 Mo | 0,74 s | 1,08 s, 3,3 Mo | 3,78 s |
| Cocher Épiciers (761) | 0,31 s | 0,45 s | 0,26 s | 0,25 s |
| Cocher Listes particulières (13 737) | 4,4 s, 2,4 Mo | 6,2 s | 2,9 s | 2,9 s |
| All (22 068) | 7,0 s, 3,9 Mo | 9,5 s | 5,0 s | 5,1 s |
| Chercher « rue de la paix » (16) | 0,18 s | 0,33 s | 0,08 s | 0,08 s |

- Après l'arrivée, `/essai` ne transfère plus rien et ne dépend plus du
  réseau. Le fichier de 1807 pèse 11,2 Mo, 2,8 Mo en gzip ; sans l'uuid des
  empans (40 % du poids, qui ne sert que de clé de rendu) et sans
  `normalized` quand il égale le texte découpé (90 % des empans), environ
  1,4 Mo.
- Le volume chargé occupe environ 27 Mo de tas JS. Sur All : 126 Mo contre
  99 Mo ; même DOM (513 000 nœuds, environ 23 par ligne).
- Listes particulières, en détail : style et mise en page coûtent 2,1 s
  sur les deux pages ; le script, 1,5 s sur `/` (flux RSC de 26 Mo) contre
  0,8 s sur `/essai`. Requête locale : 13 ms au plus (603 rubriques, All,
  recherches).

## Bilan

- Plus rapide dès qu'on interagit : recherche 2 à 4 fois, grosses
  sélections d'un tiers à la moitié, petites sélections égales ; et plus de
  charge serveur ni de dépendance au réseau.
- Plus lent à l'arrivée : un fichier par volume à télécharger (3,8 s en 4G
  aujourd'hui, environ 2 s au format compact ; instantané ensuite si le
  fichier est mis en cache avec un nom versionné).
- Le DOM reste le goulot des grosses sélections, quelle que soit
  l'architecture : pagination ou `content-visibility` à prévoir dans les
  deux cas (`docs/IDEES.md`).
- Reste à chiffrer : le nombre et la taille des volumes à terme, pour la
  recherche dans plusieurs volumes et les liens temporels.
