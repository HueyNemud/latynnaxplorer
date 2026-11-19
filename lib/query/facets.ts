// Facettes de structure (docs/DESIGN.md, « Facettes » ; docs/composants/facettes.md) : toutes
// les valeurs possibles, cochées ou non. Les volumes, et l'arbre des rubriques de chacun avec
// le nombre d'entrées de chaque sous-arbre, compte tenu du texte cherché (pas des rubriques
// cochées : le décompte dit ce que l'on obtiendrait en cochant la rubrique).

import type postgres from "postgres";
import type { Query } from "./query.ts";
import { contains } from "./resolve.ts";

export interface FacetVolume {
  /** dc:identifier, ex. « 1807_AD75-PER292 » */
  id: string;
  /** dc:title ; null tant qu'il n'est pas renseigné */
  title: string | null;
  /** début de dcterms:temporal, AAAA-MM-JJ */
  temporalStart: string;
}

export interface FacetSection {
  id: string;
  /** rubrique parente ; null au premier niveau du volume */
  parentId: string | null;
  volumeId: string;
  /** intitulé tel que numrev le donne */
  text: string;
  /** entrées du sous-arbre, la rubrique comprise, qui contiennent le texte cherché s'il y en a un */
  entries: number;
}

export interface Facets {
  /** dans l'ordre des dates */
  volumes: FacetVolume[];
  /** par volume, dans l'ordre de lecture : un parent vient avant ses enfants */
  sections: FacetSection[];
}

/**
 * Volumes et rubriques, avec leurs décomptes. Décomptes lus par parent_closure (chaque rubrique
 * ancêtre du parent de l'entrée, ce parent compris), en une requête groupée. Sur 1807 (603
 * rubriques) : 12 ms sans texte, 44 ms pour « rue », le cas le pire.
 */
export async function facets(sql: postgres.Sql, { text }: Pick<Query, "text">): Promise<Facets> {
  const matching = text === undefined ? sql`` : sql`AND ${contains(sql, sql`e.text`, text)}`;
  const [volumes, sections] = await Promise.all([
    sql<FacetVolume[]>`
      SELECT id, title, temporal_start::text AS "temporalStart"
      FROM volume ORDER BY temporal_start, id`,
    sql<FacetSection[]>`
      SELECT s.id, s.parent_id AS "parentId", s.volume_id AS "volumeId", s.text,
             coalesce(c.entries, 0)::int AS entries
      FROM node s
      LEFT JOIN (
        SELECT pc.ancestor_id AS id, count(*) AS entries
        FROM node e JOIN parent_closure pc ON pc.descendant_id = e.parent_id
        WHERE e.kind = 'entry' ${matching}
        GROUP BY pc.ancestor_id
      ) c ON c.id = s.id
      WHERE s.kind = 'section'
      ORDER BY s.volume_id, s.document_reading_order`,
  ]);
  return { volumes, sections };
}
