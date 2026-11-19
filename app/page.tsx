// La sélection désignée par l'URL, dans la vue Liste. Densité automatique : un nœud → sa fiche ;
// plusieurs → leur nombre, en attendant la vue Liste (sprint 5).

import { notFound } from "next/navigation";
import { NodeDetail } from "../components/NodeDetail.tsx";
import { db } from "../lib/db/server.ts";
import { parseQuery } from "../lib/query/query.ts";
import { context, NodeNotFoundError, resolve } from "../lib/query/resolve.ts";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  // Requête déjà validée par proxy.ts : une QueryError ici serait une erreur du site.
  const query = parseQuery(toURLSearchParams(await searchParams));
  const sql = db();
  const [subgraph, sections] = await Promise.all([
    resolve(sql, query).catch((error: unknown) => {
      if (error instanceof NodeNotFoundError) notFound();
      throw error;
    }),
    context(sql, query),
  ]);
  const [node] = subgraph.nodes;
  if (subgraph.nodes.length === 1 && node) return <NodeDetail node={node} context={sections} />;
  return (
    <p>
      {subgraph.nodes.length.toLocaleString("en")} nodes selected. The List view, which will show
      them, is not available yet.
    </p>
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
