// Requête : ce que l'utilisateur demande, lisible depuis l'URL et réécrite à l'identique.
// Les noms de paramètres sont en anglais (application internationale).
// Filtres et scénarios : docs/SCENARIOS.md. Tous les critères sont facultatifs et se combinent
// (conjonction) ; sans critère, la requête est vide (proxy.ts la remplace par la sélection par
// défaut).

export interface Query {
  /** Scénario 1 : uuid du nœud dont on veut tout le sous-arbre, lui compris. */
  subtree?: string;
  /** Scénario 2 : texte que le nœud doit contenir, sans tenir compte des accents ni de la casse. */
  text?: string;
}

/** Requête invalide : paramètre répété ou mal formé. */
export class QueryError extends Error {
  override name = "QueryError";
}

// Forme 8-4-4-4-12 seulement : les uuid de numrev ne sont pas tous d'une version RFC 4122.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Lit la requête dans les paramètres d'une URL ; les paramètres inconnus sont ignorés. */
export function parseQuery(params: URLSearchParams): Query {
  const query: Query = {};
  const subtree = single(params, "subtree");
  if (subtree !== undefined) {
    if (!UUID.test(subtree)) throw new QueryError(`« subtree » n'est pas un uuid : ${subtree}`);
    query.subtree = subtree.toLowerCase();
  }
  // Blancs réduits à une espace ; vide, le texte ne filtre rien (un formulaire envoie « text= »).
  const text = single(params, "text")?.trim().replace(/\s+/g, " ");
  if (text) query.text = text;
  return query;
}

/** Valeur d'un paramètre donné au plus une fois. */
function single(params: URLSearchParams, name: string): string | undefined {
  const values = params.getAll(name);
  if (values.length > 1) throw new QueryError(`paramètre « ${name} » répété`);
  return values[0];
}

/** Écrit la requête en paramètres d'URL ; parseQuery la relit à l'identique. */
export function serializeQuery(query: Query): URLSearchParams {
  const params = new URLSearchParams();
  if (query.subtree !== undefined) params.set("subtree", query.subtree);
  if (query.text !== undefined) params.set("text", query.text);
  return params;
}
