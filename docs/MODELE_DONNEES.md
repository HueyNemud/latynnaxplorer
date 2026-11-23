# Modèle de données

Les volumes sont servis en fichiers, hébergés en ligne, et interrogés dans
le navigateur (`lib/query/`). Décisions : `docs/DECISIONS.md` ; requêtes :
`docs/SCENARIOS.md`.

Principes :
- **numrev fait foi** : l'export reprend ses fichiers tels quels, sans
  rattrapage. Les défauts de données se corrigent dans numrev.
- **Un seul type de nœud** : rubriques, entrées et éléments hors champ sont
  des nœuds, traités de la même manière.
- **Le fichier ne porte que l'information** : ce qui se déduit est
  recalculé au chargement.

## 1. Les données sources

`data/<volume>/` (hors Git) : `<volume>.document.json` et
`<volume>.structure.json`, livrable numrev (format de référence :
`../adresses_revolutionnaires/docs/format_export.md`, `numrev-document/1`,
`numrev-structure/2`), et `volume.json`, métadonnées Dublin Core écrites à
la main. Fichiers de 1807 : 10,8 + 18,1 Mo.

| Fichier | Objet | 1807 | Repris |
|---|---|---|---|
| `structure.json` | titre (rubrique) | 603 | `id`, `parent`, `heading` ; position |
| | entrée | 20 709 | `id`, `parent`, `text`, `spans` ; position |
| | élément hors champ (titre courant, numéro de page, note, texte libre) | 846 | `id`, `parent`, `text` ; position |
| | empan | 45 673 (SUBJ 20 863, ADDR 19 980, DESC 4 830) | `label`, `start`, `end`, `normalized` |
| `document.json` | page | 250 objets (248 pages du PDF) | numéro de page (via les lignes) |
| | ligne | 22 625 (dont 219 `SUPPRIMÉE`) | `bbox_estimate` (union par page) ; ordre des lignes = ordre de lecture |
| `volume.json` | métadonnées Dublin Core | 1 | `identifier`, `title`, `temporal` |

Non repris : plages, blocs, mots et confiances OCR, `level` des titres,
`kind` et `members` des entrées (groupes à accolade), `quality`, `id` et
`pieces` des empans, provenance.

Observations remontées à numrev (l'application ne les corrige pas) : 51
entrées, 3 rubriques et 89 éléments hors champ sans ligne boîtée (pas
d'ancre) ; 19 entrées simples à plusieurs SUBJ ; 197 renvois « voyez » non
structurés ; nature des éléments hors champ non exportée.

## 2. Le modèle

Un volume est une liste de **nœuds** dans l'ordre de lecture. Un nœud
(`SubgraphNode`, `lib/query/types.ts`) porte :

- `id` (uuid numrev), `kind` (`section` pour une rubrique, `entry`,
  `out_of_scope`), `parentId` (sa rubrique, `null` sous la racine numrev),
  `text` (l'intitulé d'une rubrique) ;
- `documentReadingOrder` : son rang dans le volume, tous types confondus,
  celui de sa première ligne dans `document.json` ;
- `spans` : les empans d'une entrée (SUBJ, DESC, ADDR), positions en points
  de code du texte brut, dans l'ordre du texte ;
- `anchors` : par page touchée, l'union des boîtes de ses lignes (repère
  numrev 0–1000) ; aucune ligne boîtée sur la page, pas d'ancre.

**Arcs**, déduits des nœuds :

| Arc | Entre | Déduit de |
|---|---|---|
| `member_of` | entrée ou élément hors champ → rubrique | `parentId` |
| `child_of` | rubrique → rubrique | `parentId` |
| `follows` | entrée → entrée suivante dans l'ordre de lecture, à travers les rubriques | l'ordre de lecture, au chargement |

numrev donne un seul arbre : tout objet a pour parent une rubrique (ou la
racine). Un élément hors champ est rangé sous la rubrique ouverte à cet
endroit, au sens de l'ordre de lecture. **Ordre de lecture et succession
sont distincts** : l'ordre est un attribut de tous les nœuds, `follows` une
relation entre entrées seulement.

Choix à garder en tête :
- les éléments hors champ sont `member_of` comme les entrées : « toute la
  rubrique » les inclut ;
- pas de page ni de taille d'image : un numéro de page du PDF suffit, la
  taille viendra du serveur IIIF ;
- un empan n'a pas d'identifiant : il se désigne par son nœud et son rang
  dans le texte (point d'accroche du géocodage, plus tard).

## 3. Les fichiers

`scripts/export-volume.ts data/<volume> [dossier]` valide les trois
fichiers (`scripts/validate.ts`, contre les JSON Schema de numrev copiés
dans `scripts/schemas/` et `volume.schema.json` ; un fichier non conforme
arrête l'export), écrit `<volume>.json` et l'ajoute à `index.json`. Une
boucle dans les parents arrête l'export. Format : `lib/query/volume.ts`.

**L'index** liste les volumes dans l'ordre des dates ; `url` est relative
à l'index ou absolue :

```json
{ "volumes": [
  { "id": "1807_AD75-PER292", "title": null, "temporalStart": "1807-01-01",
    "url": "1807_AD75-PER292.json" } ] }
```

**Le fichier d'un volume** donne ses métadonnées et ses nœuds dans l'ordre
de lecture ; il omet ce qui se déduit : l'ordre de lecture (le rang dans la
liste), les empans et ancres absents, et `normalized` quand il est le texte
de l'empan tel quel (90 % des empans).

```json
{ "volume": { "id": "1807_AD75-PER292", "title": null, "temporalStart": "1807-01-01" },
  "nodes": [
    { "id": "94314853-0eff-5081-a0ed-da8768ec40b2", "kind": "entry",
      "parentId": "891b0a79-2544-5b16-ae74-3a8975449af0",
      "text": "ARCHÉDÉACON (Edmont) fils aîné, rue Duphot, 4.",
      "spans": [ { "label": "SUBJ", "charStart": 0, "charEnd": 30 },
                 { "label": "ADDR", "charStart": 32, "charEnd": 46 } ],
      "anchors": [ { "page": 7, "x0": 55, "y0": 271, "x1": 437, "y1": 307 } ] } ] }
```

1807 : 22 158 nœuds, 7,2 Mo, 1,3 Mo compressés en gzip. Chargé,
`indexVolume` rétablit ce qui est omis, et calcule l'index des nœuds, leur
texte plié pour la recherche et `follows` (30 ms environ) ; le volume tient
alors environ 27 Mo de mémoire.

## 4. Requête → sous-graphe induit

`lib/query/`, fonctions pures sur un volume chargé :

- `selection` : les nœuds que désigne la requête (conjonction de ses
  critères ; sous-arbre : le nœud et tous ses descendants, reconnus par
  leurs ancêtres, `ancestors`), dans l'ordre de lecture ;
- `context` : les rubriques ancêtres d'une sélection qui n'en font pas
  partie ;
- `resolve` : la sélection et les arcs dont les deux bouts en font partie
  (`inducedArcs`) ; la vue n'a besoin que des nœuds ;
- `sections` (`facets.ts`) : les rubriques et le nombre d'entrées de leur
  sous-arbre qui contiennent le texte cherché ;
- `explore.ts`, sur plusieurs volumes : quels volumes une requête demande
  (`neededVolumes`), ce qu'elle donne sur les volumes chargés, mis bout à
  bout dans l'ordre de l'index (`explore`), et la fiche d'un nœud
  (`detail` : le nœud et son chemin).

Une requête parcourt tout le volume : 13 ms au plus sur 1807. Le coût d'une
grosse sélection est son rendu : la Liste la montre par tranches
(`docs/composants/noeud-liste.md`).

## Plus tard

- **Géocodage** : un résultat par empan ADDR (nœud et rang), géométrie,
  score, méthode ; critère par secteur de la carte. À trancher : point
  seul ou géométrie de voie pour les adresses sans numéro (1 130 en 1807).
- **Liens temporels** : `docs/IDEES.md`.
