// Requête : ce que l'utilisateur demande, lisible depuis l'URL et réécrite à l'identique.
// Les noms de paramètres sont en anglais (application internationale).
// Filtres et scénarios : docs/SCENARIOS.md.

export interface Query {
  /** Scénario 1 : uuid du nœud dont on veut tout le sous-arbre, lui compris. */
  subtree: string;
}

/** Requête invalide : paramètre absent, répété ou mal formé. */
export class QueryError extends Error {
  override name = "QueryError";
}

// Forme 8-4-4-4-12 seulement : les uuid de numrev ne sont pas tous d'une version RFC 4122.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Lit la requête dans les paramètres d'une URL ; les paramètres inconnus sont ignorés. */
export function parseQuery(params: URLSearchParams): Query {
  const values = params.getAll("subtree");
  const [value] = values;
  if (value === undefined) throw new QueryError("paramètre « subtree » absent");
  if (values.length > 1) throw new QueryError("paramètre « subtree » répété");
  if (!UUID.test(value)) throw new QueryError(`« subtree » n'est pas un uuid : ${value}`);
  return { subtree: value.toLowerCase() };
}

/** Écrit la requête en paramètres d'URL ; parseQuery la relit à l'identique. */
export function serializeQuery(query: Query): URLSearchParams {
  return new URLSearchParams({ subtree: query.subtree });
}
