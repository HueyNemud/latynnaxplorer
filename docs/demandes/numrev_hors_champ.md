# Demande à numrev : exporter les éléments hors champ comme entités

Prompt destiné à un agent qui travaille dans `../adresses_revolutionnaires`
(numrev). Rédigé le 2026-10-30 depuis latynnaxplorer.

**Traitée le 2026-10-30** : numrev `c3b94a0` (pages partagées, partie de
l'autre plage `SUPPRIMÉE`) et `2548ce1` (tableau `out_of_scope`,
`numrev-structure/2`), branche `stabilisation`.

---

## Contexte

Le projet voisin `../latynnaxplorer` (site d'exploration des annuaires) importe
le livrable de `numrev export` (`<volume>.structure.json` et
`<volume>.document.json`) en lecture seule, sans rien corriger : numrev fait
foi. Il fait des titres et des entrées de `structure.json` les nœuds d'un graphe
(uuid, parent, ordre de lecture). Il voudrait faire de même avec les éléments
hors champ (lignes de classe `OUT OF SCOPE` : titres courants, numéros de page,
texte libre comme les horaires des Postes ou les tarifs de l'octroi), pour
pouvoir un jour parcourir un annuaire entier dans son ordre de lecture.

## Constat

- `numrev assemble` (étape 4) fait déjà de chaque ligne `OUT OF SCOPE` une
  entité : un `uuid` (uuid5 du nom du document et de la `cle` de la ligne) et un
  `parent_uuid` (le titre ouvert, ou la racine), dans `.entities.csv` puis
  `.ner.csv`. En 1807 : 981 entités `OUT OF SCOPE`, toutes d'une seule ligne,
  854 sous un titre et 127 à la racine.
- `numrev export` (étape 6) les écarte : `format_export.md` indique qu'elles « ne
  figurent que dans la couche documentaire », comme lignes, sans uuid ni parent.
  Un consommateur ne peut donc ni les identifier de façon stable, ni les
  rattacher à une rubrique sans refaire lui-même le travail d'`assemble`.

## Demande

Exporter les entités `OUT OF SCOPE` dans `<volume>.structure.json`, au même
titre que `titles` et `entries`, avec au minimum :

- `id` : l'uuid d'`assemble` (stable aux mêmes conditions que celui des entrées) ;
- `parent` : le `parent_uuid` d'`assemble` (titre ou `root`) ;
- `range`, `pages`, `text`, `lines` (`{line, start, end}`), comme un titre ;
- dans l'ordre du document, comme `titles` et `entries`.

Le nom du tableau et le détail des champs restent à décider avec l'utilisateur
(par exemple `out_of_scope`, ou un nom plus parlant).

## Points à trancher avec l'utilisateur

1. **Pages partagées entre deux plages** (1807 : p. 192 et 212). Par
   convention de curation, la partie d'une page qui appartient à l'autre plage
   est classée `OUT OF SCOPE` dans chaque copie. Ces lignes sont des titres et
   des entrées de l'autre plage, pas de vrais éléments hors champ : en 1807,
   127 des 141 lignes hors champ de ces deux pages sont dans ce cas. Les
   exporter telles quelles créerait des doublons. Il faut que numrev les
   distingue (classe dédiée, règle à l'export ou autre) : latynnaxplorer ne
   les filtrera pas lui-même.
2. **Granularité** : une entité par ligne (règle actuelle d'`assemble` : « une
   ligne, jamais fusionnée »), ou regroupement d'un paragraphe de texte libre
   en une entité ? La règle actuelle convient à latynnaxplorer si elle est
   jugée juste.
3. **Nature de l'élément** (titre courant, numéro de page, texte) : utile, mais
   seulement si numrev la connaît déjà ; ne rien inventer.
4. **Changement de format** : ajout d'un tableau dans `structure.json`
   (`additionalProperties: false` au premier niveau). Suivre la règle du
   `CLAUDE.md` de numrev : demander à l'utilisateur, et décider si c'est un
   simple ajout ou une nouvelle version `numrev-structure/2`.

## À mettre à jour dans numrev (selon son `CLAUDE.md`)

`docs/format_export.md`, `src/numrev/export/schemas/structure.schema.json`
(et le `$defs` dupliqué tenu identique), `tests/test_export.py`,
`src/numrev/viewers/directory.html`, puis réexporter 1807.

## Livrable attendu par latynnaxplorer

Le nouvel export de 1807 et le schéma JSON correspondant ; latynnaxplorer
recopiera le schéma dans `scripts/schemas/` et adaptera son import.
