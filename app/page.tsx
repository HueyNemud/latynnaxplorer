// La sélection désignée par l'URL, dans la vue Liste, entourée de son contexte, sous le champ de
// recherche.

import { notFound } from "next/navigation";
import { NodeList } from "../components/NodeList.tsx";
import { SearchForm } from "../components/SearchForm.tsx";
import { db } from "../lib/db/server.ts";
import { parseQuery } from "../lib/query/query.ts";
import { context, NodeNotFoundError, resolve } from "../lib/query/resolve.ts";
import { segments } from "../lib/text/segments.ts";

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
  // le nœud désigné, s'il y en a un : dans la sélection, ou dans le contexte s'il ne contient pas
  // le texte
  const root = [...subgraph.nodes, ...sections].find((n) => n.id === query.subtree);
  return (
    <>
      {/* titre pour les lecteurs d'écran : le texte du nœud désigné, sinon le texte cherché */}
      <h1 className="visually-hidden" lang="fr">
        {root
          ? segments(root.text, [])
              .map((s) => s.text)
              .join("")
          : query.text}
      </h1>
      <SearchForm text={query.text} />
      {subgraph.nodes.length > 0 ? (
        <NodeList context={sections} nodes={subgraph.nodes} />
      ) : (
        <p className="no-match">No match.</p>
      )}
    </>
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
