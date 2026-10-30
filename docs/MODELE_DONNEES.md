# Modèle de données — v2

État : schéma et import implémentés ; requêtes de la section 3 non implémentées. Décisions : `docs/DECISIONS.md`. Extensions
prévues (géocodage, liens temporels) : fin de document.

Sources : `data/<volume>/` (`<volume>.document.json`,
`<volume>.structure.json`, `volume.json`), hors Git.

Principes retenus :
- **numrev fait foi** : l'application importe l'export tel quel, sans
  rattrapage. Les défauts de données se corrigent dans numrev.
- **Schéma minimal et commun** : sections et entrées sont des nœuds d'une
  même table, traités de la même manière.
- **Un seul annuaire** pour commencer ; pas de liens temporels.

## 1. Les données sources

Format de référence : `../adresses_revolutionnaires/docs/format_export.md`
(`numrev-document/1`, `numrev-structure/1`). Fichiers de 1807 (10,8 + 17,9 Mo).

| Fichier | Objet | Nombre | Repris dans le modèle |
|---|---|---|---|
| `structure.json` | titre (section) | 603 | `id`, `parent`, `heading` ; position dans la liste |
| | entrée | 20 709 | `id`, `parent`, `text`, `spans` ; position dans la liste |
| | empan | 45 673 (SUBJ 20 863, ADDR 19 980, DESC 4 830) | `id`, `label`, `start`, `end`, `normalized` |
| `document.json` | page | 250 objets (248 pages du PDF) | numéro de page (via les lignes) |
| | ligne | 22 625 | `bbox_estimate` des lignes d'un nœud (union par page) |
| `volume.json` (à la main) | métadonnées Dublin Core | 1 | `identifier`, `title`, `temporal` |

Non repris : plages, blocs, mots et confiances OCR, `level` des titres,
`kind` et `members` des entrées (groupes à accolade), `quality`, `pieces`
des empans, provenance.

Observations à remonter à numrev (l'application ne les corrige pas) :
- 51 entrées et quelques titres n'ont aucune ligne boîtée : **pas d'ancre**
  pour eux ;
- 19 entrées simples contiennent plusieurs SUBJ ;
- 197 renvois « voyez » non structurés ;
- p. 192 et 212 lues dans deux plages (sans effet ici : seules les lignes
  rattachées à un nœud sont lues) ;
- éléments hors champ (981 lignes) non exportés comme entités : non importés
  en attendant numrev (demande : `docs/demandes/numrev_hors_champ.md`).

## 2. Modèle

### Tables

| Table | Rôle | Lignes (1807) |
|---|---|---|
| `volume` | l'annuaire : identifiant, titre, intervalle temporel | 1 |
| `node` | **nœud** typé `entry` ou `section` | 21 312 |
| `span` | champs structurés d'une entrée : SUBJ / DESC / ADDR | 45 673 |
| `anchor` | ancrage d'un nœud : page du PDF et boîte, une ligne par page touchée | ≈ 21 250 |

Pas de table `page` : un numéro de page du PDF suffit pour ancrer (les
boîtes sont dans un repère relatif 0–1000) et désignera plus tard la toile
IIIF. La taille de l'image viendra du serveur IIIF.

### Arcs

| Arc | Entre | Stockage |
|---|---|---|
| `member_of` | entrée → section | `node.parent_id` d'une entrée |
| `child_of` | section → section | `node.parent_id` d'une section |
| `follows` | entrée → entrée suivante dans l'ordre de lecture du volume, à travers les sections, sans compter les autres nœuds | `node.document_reading_order` : première entrée de rang supérieur |

`member_of` et `child_of` sont la même colonne : numrev donne un seul arbre
(champ `parent`) où entrées et titres ont pour parent un titre. Le type
d'arc se lit au type du nœud source. Aucune table d'arcs : tout est déduit
des colonnes.

**Ordre de lecture et succession sont distincts.** L'ordre de lecture est un
attribut commun à tous les nœuds (`document_reading_order`, rang 0…n-1 dans
le volume, tous types confondus) : une vue qui parcourt le document trie
par lui, sans passer par un arc. `follows` est une relation entre entrées
seulement (« l'entrée suivante ») ; elle saute les sections et, plus tard,
les éléments hors champ, et ne change pas quand on ajoute un type de nœud.

### Diagramme

```mermaid
erDiagram
    volume ||--o{ node : "volume_id"
    node |o--o{ node : "parent_id (member_of / child_of)"
    node ||--o{ span : "SUBJ / DESC / ADDR (entrées)"
    node ||--o{ anchor : "page + boîte"
```

### Schéma Drizzle

Source de vérité : `lib/db/schema.ts` (commenté), appliqué par
`pnpm db:push` (`drizzle-kit push`, sans migrations). Noms de colonnes SQL
explicites en snake_case. Les extensions `pg_trgm` et `unaccent`, et la
fonction `immutable_unaccent` (enveloppe `IMMUTABLE` de `unaccent`, exigée
pour l'indexer), sont créées par `lib/db/init.sql` à la création de la
base Docker, pas par Drizzle. L'image PostGIS crée en plus ses propres
extensions (`postgis`, `postgis_topology`, `postgis_tiger_geocoder`,
`fuzzystrmatch`), inutilisées pour l'instant.

Types retenus : boîtes d'ancre en `real` (le schéma numrev les déclare
`number`), positions d'empan en `integer`, dates de l'intervalle en `date`.

### Import (`scripts/`)

- `node` : les `titles` et les `entries` du `structure.json` ;
  `document_reading_order` = rang de leur première ligne dans l'ordre des
  lignes de `document.json` (ordre de lecture du volume) ; `parent_id` =
  `parent`, sauf la racine numrev → `null`.
- `anchor` : pour chaque nœud et chaque page, union des `bbox_estimate` non
  nulles de ses lignes ; aucune ligne boîtée sur la page → pas d'ancre.
- `volume` : `data/<volume>/volume.json`.
- Avant tout : validation des trois fichiers (`scripts/validate.ts`) contre
  les JSON Schema de numrev (copiés dans `scripts/schemas/`) et contre
  `scripts/schemas/volume.schema.json` ; les trois doivent nommer le même
  volume. Un fichier non conforme arrête l'import.
- Le volume est remplacé en entier, dans une transaction.

Résultat pour 1807 : 21 312 nœuds (603 sections, 20 709 entrées), 45 673
empans, 21 260 ancres ; 51 entrées et 3 sections sans ancre ; 2 entrées
ancrées sur deux pages.

### Choix discutables ⚠️

1. **Une seule table `node`** : `text` change de source selon le type
   (`heading` pour une section) ; rien en base n'empêche un empan sur une
   section ou une entrée parente d'une entrée (numrev fait foi).
2. **`follows` calculé, pas stocké** : « première entrée de rang
   supérieur » par sous-requête, servie par l'index
   `(volume_id, kind, document_reading_order)`.
3. **Pas de `page`**, pas de taille d'image : à revoir avec IIIF.
4. **Ordre alphabétique** : sur le premier SUBJ (`min(char_start)`), par
   sous-requête, sans colonne dénormalisée.
5. **Géocodage** : pas de table, sprint dédié (voir « Plus tard ») ; les
   empans ADDR et leur uuid en sont le point d'accroche.

## 3. Requête → sous-graphe induit (SQL)

### Étape 1 : les nœuds (seule partie qui dépend de la requête)

Exemple : les entrées de la rubrique BOULANGERS et de ses sous-rubriques
dont un nom ressemble à « Lefevre », dans une période.

```sql
WITH RECURSIVE
subtree AS (                       -- la section et tous ses descendants
  SELECT id FROM node WHERE id = :section
  UNION ALL
  SELECT n.id FROM node n JOIN subtree t ON n.parent_id = t.id
),
nodes AS (
  SELECT n.id
  FROM node n
  JOIN volume v ON v.id = n.volume_id
  WHERE n.kind = 'entry'
    AND n.id IN (SELECT id FROM subtree)
    AND v.temporal_end >= :from AND v.temporal_start <= :to         -- période
    AND EXISTS (                                                     -- champ, tolérant aux fautes et aux accents
      SELECT 1 FROM span s
      WHERE s.node_id = n.id AND s.label = 'SUBJ'
        AND immutable_unaccent(:name) <% immutable_unaccent(s.normalized)
    )
)
SELECT id FROM nodes;
```

Autres sélections : des sections (`kind = 'section' AND immutable_unaccent(text) % immutable_unaccent('boulangers')`),
une fiche (`id = :id`), tout l'annuaire (`volume_id = :v`).

### Étape 2 : les arcs (code fixe, ne dépend que des nœuds)

```sql
-- member_of / child_of : le parent, si les deux bouts sont sélectionnés
SELECT n.id AS source, n.parent_id AS target,
       CASE n.kind WHEN 'entry' THEN 'member_of' ELSE 'child_of' END AS kind
FROM node n
WHERE n.id IN (SELECT id FROM nodes)
  AND n.parent_id IN (SELECT id FROM nodes);

-- follows : l'entrée suivante dans l'ordre de lecture, si les deux sont sélectionnées
SELECT f.source, f.target, 'follows' AS kind
FROM (
  SELECT a.id AS source,
         (SELECT b.id FROM node b
          WHERE b.volume_id = a.volume_id AND b.kind = 'entry'
            AND b.document_reading_order > a.document_reading_order
          ORDER BY b.document_reading_order LIMIT 1) AS target
  FROM node a
  WHERE a.kind = 'entry' AND a.id IN (SELECT id FROM nodes)
) f
WHERE f.target IN (SELECT id FROM nodes);
```

### Étape 3 : étendre par les liens documentaires

Chaque extension rend un nouvel ensemble de nœuds ; les arcs se recalculent
par l'étape 2.

```sql
-- sections parentes (un pas)
SELECT id FROM nodes
UNION SELECT parent_id FROM node WHERE id IN (SELECT id FROM nodes) AND parent_id IS NOT NULL;

-- toutes les sections ancêtres
WITH RECURSIVE up(id) AS (
  SELECT id FROM nodes
  UNION
  SELECT n.parent_id FROM node n JOIN up ON n.id = up.id WHERE n.parent_id IS NOT NULL
)
SELECT id FROM up;

-- contenu des sections sélectionnées (tous les descendants)
WITH RECURSIVE down(id) AS (
  SELECT id FROM nodes
  UNION
  SELECT n.id FROM node n JOIN down ON n.parent_id = down.id
)
SELECT id FROM down;

-- entrées voisines dans le texte (précédente et suivante, par follows)
SELECT id FROM nodes
UNION
SELECT (SELECT b.id FROM node b
        WHERE b.volume_id = a.volume_id AND b.kind = 'entry'
          AND b.document_reading_order > a.document_reading_order
        ORDER BY b.document_reading_order LIMIT 1)
FROM node a WHERE a.kind = 'entry' AND a.id IN (SELECT id FROM nodes)
UNION
SELECT (SELECT b.id FROM node b
        WHERE b.volume_id = a.volume_id AND b.kind = 'entry'
          AND b.document_reading_order < a.document_reading_order
        ORDER BY b.document_reading_order DESC LIMIT 1)
FROM node a WHERE a.kind = 'entry' AND a.id IN (SELECT id FROM nodes);
```

## Plus tard : géocodage (sprint dédié)

- Résultat rattaché à l'uuid d'un empan ADDR (géométrie, score, méthode),
  dans une table à part ; index GiST pour le filtre par zone
  (`geom && ST_MakeEnvelope(...)`).
- À trancher alors : point seul ou géométrie de voie pour les adresses sans
  numéro (1 130 en 1807).

## Plus tard : liens temporels (sprint dédié)

- Arcs entre entrées d'éditions successives, importés de la jointure numrev
  `<A>__<B>.<méthode>.join.csv` (`methode`, `certitude`,
  `niveau_incertitude`, `score`).
- Appariement des rubriques entre éditions (numrev `alignment/sections.py`,
  cas 1-N) : arcs temporels entre sections.
- Composante (lignée) par parcours non orienté jusqu'au point fixe :

```sql
WITH RECURSIVE
edge(a, b) AS (SELECT source_id, target_id FROM link UNION ALL SELECT target_id, source_id FROM link),
component(id) AS (
  SELECT id FROM nodes
  UNION                            -- UNION : écarte les doublons, s'arrête sur les cycles
  SELECT e.b FROM component c JOIN edge e ON e.a = c.id
)
SELECT id FROM component;
```
