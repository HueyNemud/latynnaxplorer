// Requête : ce que l'utilisateur demande, lisible depuis l'URL et réécrite à l'identique.
// Filtres et scénarios : docs/SCENARIOS.md. Tous les critères sont facultatifs et se combinent
// (conjonction) ; sans critère, la requête est vide et ne sélectionne rien.

/** Zones du texte où chercher : les empans sujet, description et adresse, et le texte hors empan. */
export const ZONES = ["subj", "desc", "loc", "other"] as const;
export type Zone = (typeof ZONES)[number];

export interface Query {
  /**
   * Scénario 1 : uuid des nœuds dont on veut tout le sous-arbre, eux compris ; plusieurs : l'union
   * de leurs sous-arbres (facettes de structure). Jamais vide, sans doublon, dans l'ordre de l'URL.
   */
  subtree?: readonly string[];
  /** Scénario 2 : texte que le nœud doit contenir, sans tenir compte des accents ni de la casse. */
  text?: string;
  /**
   * Zones où chercher le texte (paramètre `in`, répétable) ; absent : tout le texte. Seulement
   * avec un texte ; jamais vide ni complet, sans doublon, dans l'ordre de ZONES.
   */
  zones?: readonly Zone[];
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
  // répétable : chaque valeur est un sous-arbre de plus (union)
  const subtrees = params.getAll("subtree");
  for (const subtree of subtrees)
    if (!UUID.test(subtree)) throw new QueryError(`« subtree » n'est pas un uuid : ${subtree}`);
  if (subtrees.length > 0) query.subtree = [...new Set(subtrees.map((s) => s.toLowerCase()))];
  // Blancs réduits à une espace ; vide, le texte ne filtre rien (un formulaire envoie « text= »).
  const text = single(params, "text")?.trim().replace(/\s+/g, " ");
  if (text) query.text = text;
  // Aucune zone ou toutes : tout le texte (un formulaire sans case cochée n'envoie rien).
  const zones = params.getAll("in");
  for (const zone of zones)
    if (!isZone(zone)) throw new QueryError(`« in » n'est pas une zone : ${zone}`);
  const chosen = ZONES.filter((z) => zones.includes(z));
  if (text && chosen.length > 0 && chosen.length < ZONES.length) query.zones = chosen;
  return query;
}

function isZone(value: string): value is Zone {
  return (ZONES as readonly string[]).includes(value);
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
  for (const subtree of query.subtree ?? []) params.append("subtree", subtree);
  if (query.text !== undefined) params.set("text", query.text);
  for (const zone of query.zones ?? []) params.append("in", zone);
  return params;
}

/** Adresse de la page pour la requête : `pathname`, et ses paramètres s'il y en a. */
export function queryUrl(pathname: string, query: Query): string {
  const params = serializeQuery(query);
  return params.size > 0 ? `${pathname}?${params}` : pathname;
}
