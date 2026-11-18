// Modèle de données v2 : voir docs/MODELE_DONNEES.md.
// Les extensions et immutable_unaccent() sont créées par lib/db/init.sql.

import { type SQL, sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  check,
  date,
  foreignKey,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  smallint,
  text,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

export const nodeKind = pgEnum("node_kind", ["entry", "section", "out_of_scope"]);
export const spanLabel = pgEnum("span_label", ["SUBJ", "DESC", "ADDR"]);

/**
 * Index trigrammes (recherche floue, insensible aux accents) : un sur toute la table, plus un
 * partiel par valeur de `column`, que le planificateur prend quand la requête fixe cette valeur
 * (moins de candidats à revérifier, ex. les 603 sections parmi 22 158 nœuds).
 */
function trigramIndexes(name: string, expression: SQL, column: AnyPgColumn, values: string[]) {
  return [
    index(`${name}_trgm`).using("gin", sql`${expression} gin_trgm_ops`),
    ...values.map((value) =>
      index(`${name}_trgm_${value.toLowerCase()}`)
        .using("gin", sql`${expression} gin_trgm_ops`)
        .where(sql`${column} = ${sql.raw(`'${value}'`)}`),
    ),
  ];
}

/** Annuaire, décrit par data/<volume>/volume.json (Dublin Core). */
export const volume = pgTable(
  "volume",
  {
    id: text().primaryKey(), // dc:identifier = nom du volume numrev, ex. « 1807_AD75-PER292 »
    title: text(), // dc:title ; null tant qu'il n'est pas renseigné
    temporalStart: date("temporal_start").notNull(), // dcterms:temporal, début (AAAA-MM-JJ)
    temporalEnd: date("temporal_end").notNull(), // dcterms:temporal, fin (AAAA-MM-JJ)
  },
  (t) => [check("volume_temporal", sql`${t.temporalStart} <= ${t.temporalEnd}`)],
);

/** Nœud du graphe : une entrée, une section (titre) ou un élément hors champ de l'annuaire. */
export const node = pgTable(
  "node",
  {
    id: uuid().primaryKey(), // uuid numrev de l'entrée, du titre ou de l'élément hors champ
    volumeId: text("volume_id")
      .notNull()
      .references(() => volume.id, { onDelete: "cascade" }),
    kind: nodeKind().notNull(),
    parentId: uuid("parent_id"), // section parente : arc child_of (section), member_of (autres) ; null = racine
    // rang du nœud dans l'ordre de lecture de son volume, tous types confondus (0…n-1)
    documentReadingOrder: integer("document_reading_order").notNull(),
    text: text().notNull(), // section : « heading » ; autres : « text »
    // entrée suivante dans l'ordre de lecture du volume : arc follows (entrées seulement ;
    // null pour la dernière entrée et les autres nœuds). Calculée à l'import.
    nextEntryId: uuid("next_entry_id"),
  },
  (t) => [
    foreignKey({ columns: [t.parentId], foreignColumns: [t.id] }).onDelete("cascade"),
    // pas de cascade : supprimer une entrée seule ne doit pas emporter la précédente.
    // L'import insère tous les nœuds en une instruction : la contrainte est vérifiée à la fin.
    foreignKey({ columns: [t.nextEntryId], foreignColumns: [t.id] }),
    unique("node_volume_reading_order").on(t.volumeId, t.documentReadingOrder),
    // entrées d'un volume dans l'ordre de lecture, en parcours d'index seul (id en dernière clé :
    // Drizzle n'a pas INCLUDE). Servait au calcul de follows, désormais stocké : à réévaluer.
    index("node_volume_kind_reading_order").on(t.volumeId, t.kind, t.documentReadingOrder, t.id),
    index().on(t.parentId),
    index().on(t.nextEntryId), // entrée précédente, et vérification de la contrainte à la suppression
    ...trigramIndexes("node_text", sql`immutable_unaccent(${t.text})`, t.kind, nodeKind.enumValues),
  ],
);

/**
 * Fermeture des nœuds parents : pour chaque nœud qui a des enfants, une ligne vers lui-même et
 * vers chacun de ses descendants qui en ont aussi (dans numrev : les sections). Donnée dérivée
 * de `parent_id`, calculée à l'import ; sert à lire un sous-arbre sans parcours récursif.
 */
export const parentClosure = pgTable(
  "parent_closure",
  {
    ancestorId: uuid("ancestor_id")
      .notNull()
      .references(() => node.id, { onDelete: "cascade" }),
    descendantId: uuid("descendant_id")
      .notNull()
      .references(() => node.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.ancestorId, t.descendantId] }),
    // ancêtres d'un nœud, et suppression en cascade sans parcours de la table
    index().on(t.descendantId),
  ],
);

/** Champ structuré d'une entrée : empan SUBJ (qui), DESC (quoi) ou ADDR (où). */
export const span = pgTable(
  "span",
  {
    id: uuid().primaryKey(), // uuid numrev de l'empan (futur point d'accroche du géocodage)
    nodeId: uuid("node_id")
      .notNull()
      .references(() => node.id, { onDelete: "cascade" }),
    label: spanLabel().notNull(),
    charStart: integer("char_start").notNull(), // position dans node.text, en points de code (fin exclue)
    charEnd: integer("char_end").notNull(),
    normalized: text().notNull(), // texte sans emphase, blancs réduits (numrev)
  },
  (t) => [
    index().on(t.nodeId),
    ...trigramIndexes(
      "span_normalized",
      sql`immutable_unaccent(${t.normalized})`,
      t.label,
      spanLabel.enumValues,
    ),
  ],
);

/** Ancrage d'un nœud dans la source : sa boîte sur une page du PDF. */
export const anchor = pgTable(
  "anchor",
  {
    nodeId: uuid("node_id")
      .notNull()
      .references(() => node.id, { onDelete: "cascade" }),
    page: smallint().notNull(), // page du PDF, à partir de 1
    // union des boîtes de ses lignes sur cette page ; repère numrev 0–1000, origine en haut à gauche
    x0: real().notNull(),
    y0: real().notNull(),
    x1: real().notNull(),
    y1: real().notNull(),
  },
  (t) => [primaryKey({ columns: [t.nodeId, t.page] }), index().on(t.page)],
);
