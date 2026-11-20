// La sélection désignée par l'URL, dans la vue Liste, entourée de son contexte, sous le champ de
// recherche ; à gauche, les facettes de structure (volumes et rubriques) qui la composent.

import { notFound } from "next/navigation";
import { Facets } from "../components/Facets.tsx";
import { NodeList } from "../components/NodeList.tsx";
import { SearchForm } from "../components/SearchForm.tsx";
import { db } from "../lib/db/server.ts";
import { facets } from "../lib/query/facets.ts";
import { parseQuery } from "../lib/query/query.ts";
import { context, NodeNotFoundError, resolve } from "../lib/query/resolve.ts";
import { plainText } from "../lib/text/segments.ts";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  // Requête déjà validée par proxy.ts : une QueryError ici serait une erreur du site.
  const query = parseQuery(toURLSearchParams(await searchParams));
  const sql = db();
  const [subgraph, sections, structure] = await Promise.all([
    resolve(sql, query).catch((error: unknown) => {
      if (error instanceof NodeNotFoundError) notFound();
      throw error;
    }),
    context(sql, query),
    facets(sql, query),
  ]);
  // le nœud désigné, s'il y en a un seul : dans la sélection, ou dans le contexte s'il ne
  // contient pas le texte
  const known = new Map([...subgraph.nodes, ...sections].map((n) => [n.id, n]));
  const designated = query.subtree?.length === 1 ? query.subtree[0] : undefined;
  const root = known.get(designated ?? "");
  // la rubrique qui contient chaque nœud désigné : les facettes situent ceux qui ne se cochent pas
  const places = (query.subtree ?? []).flatMap((id) => known.get(id)?.parentId ?? []);
  return (
    <div className="explorer">
      {/* titre pour les lecteurs d'écran : le texte du nœud désigné, sinon le texte cherché,
          sinon « Selection » (plusieurs rubriques) */}
      <h1 className="visually-hidden" lang={root || query.text ? "fr" : undefined}>
        {root ? plainText(root.text) : (query.text ?? "Selection")}
      </h1>
      <Facets
        volumes={structure.volumes}
        sections={structure.sections}
        checked={query.subtree ?? []}
        places={places}
      />
      <div className="view">
        <SearchForm text={query.text} subtree={query.subtree} />
        {subgraph.nodes.length > 0 ? (
          <NodeList context={sections} nodes={subgraph.nodes} />
        ) : (
          <p className="no-match">No match.</p>
        )}
      </div>
    </div>
  );
}

function toURLSearchParams(params: SearchParams): URLSearchParams {
  const result = new URLSearchParams();
  for (const [name, value] of Object.entries(params)) {
    for (const v of Array.isArray(value) ? value : [value])
      if (v !== undefined) result.append(name, v);
  }
  return result;
}
