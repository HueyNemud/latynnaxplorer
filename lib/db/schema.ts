// Modèle de données v2 : voir docs/MODELE_DONNEES.md.
// Les extensions et immutable_unaccent() sont créées par lib/db/init.sql.

import { sql } from "drizzle-orm";
import {
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
    // rang du nœud dans l'ordre de lecture de son volume, tous types confondus (0…n-1) ;
    // arc follows : l'entrée suivante dans cet ordre
    documentReadingOrder: integer("document_reading_order").notNull(),
    text: text().notNull(), // section : « heading » ; autres : « text »
  },
  (t) => [
    foreignKey({ columns: [t.parentId], foreignColumns: [t.id] }).onDelete("cascade"),
    unique("node_volume_reading_order").on(t.volumeId, t.documentReadingOrder),
    index("node_volume_kind_reading_order").on(t.volumeId, t.kind, t.documentReadingOrder), // follows
    index().on(t.parentId),
    index("node_text_trgm").using("gin", sql`immutable_unaccent(${t.text}) gin_trgm_ops`),
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
    index("span_normalized_trgm").using(
      "gin",
      sql`immutable_unaccent(${t.normalized}) gin_trgm_ops`,
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
