# Demande à numrev : marques Markdown restées dans deux intitulés de titres

Prompt destiné à un agent qui travaille dans `../adresses_revolutionnaires`
(numrev). Rédigé le 2026-11-18 depuis latynnaxplorer.

---

## Contexte

Le projet voisin `../latynnaxplorer` (site d'exploration des annuaires) importe
le livrable de `numrev export` en lecture seule, sans rien corriger : numrev
fait foi. Il affiche l'intitulé d'un titre (`heading` de
`<volume>.structure.json`) tel quel, par exemple dans le chemin des rubriques
au-dessus d'une entrée. `docs/format_export.md` décrit `heading` comme le
« texte lisible, sans `#` ni marques d'emphase ».

## Constat

Dans l'export de 1807 (`1807_AD75-PER292`, numrev `66c2e69` avec des
modifications non commitées, exporté le 2026-10-30), deux titres gardent des
marques dans `heading` :

1. **Marques de titre au milieu de l'intitulé** — titre
   `072af369-06d2-59d6-9df9-36b16f925c82`, page 149, niveau 1 :
   - `text` : `# LISTE DE NON-COMMERÇANS, ## CONTENANT ### Les Noms et Adresses des principaux Habitans de PARIS, qui n'exercent aucun commerce.`
   - `heading` : `LISTE DE NON-COMMERÇANS, ## CONTENANT ### Les Noms et Adresses des principaux Habitans de PARIS, qui n'exercent aucun commerce.`

   Trois lignes de titre de niveaux différents semblent avoir été fusionnées
   en un seul titre ; seul le `#` de tête est retiré de `heading`.

2. **Barre oblique d'un astérisque échappé** — titre
   `63ecf8d4-05c7-57b2-8e1a-bd9a2694c466`, page 192, niveau 1 :
   - `text` : `# PRÉFECTURE DU DÉPARTEMENT DE LA SEINE, *Place de l'Hôtel-de-Ville.\**`
   - `heading` : `PRÉFECTURE DU DÉPARTEMENT DE LA SEINE, Place de l'Hôtel-de-Ville.\`

   Le nettoyage de l'emphase retire les deux astérisques (l'échappé `\*` et
   la fermeture `*`) mais garde la barre oblique. On attendrait
   `… Place de l'Hôtel-de-Ville.*` (astérisque littéral), ou rien si
   l'astérisque est lui-même un artefact de lecture.

## Demande

1. Pour le cas 1, vérifier s'il s'agit d'un seul titre ou de trois titres
   emboîtés mal fusionnés, et corriger en conséquence : titres séparés, ou
   `heading` sans les `##` / `###` intérieurs.
2. Pour le cas 2, traiter les échappements Markdown (`\*`, `\\`) dans le
   calcul de `heading` (et de `normalized` des empans, s'ils passent par le
   même nettoyage).
3. Vérifier qu'aucun autre volume n'a de `heading` contenant `#`, `*` ou `\`.

latynnaxplorer n'a rien contourné : les deux intitulés s'affichent tels
quels jusqu'à un nouvel export.
