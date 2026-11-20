// Recherche de texte en SQL, partagée par la sélection (lib/query/resolve.ts) et les décomptes
// des facettes (lib/query/facets.ts).

import type postgres from "postgres";

/**
 * Condition « la colonne contient le texte », comme une phrase entière, sans accents ni casse
 * (scénario 2), écrite comme l'expression de l'index trigrammes de `node.text`. Le texte cherché
 * est pris tel quel : ses « % », « _ » et « \ » sont échappés pour ILIKE.
 */
export function contains(
  sql: postgres.Sql,
  column: postgres.PendingQuery<postgres.Row[]>,
  text: string,
) {
  return sql`immutable_unaccent(${column})
    ILIKE '%' || immutable_unaccent(${text.replace(/[\\%_]/g, "\\$&")}) || '%'`;
}
