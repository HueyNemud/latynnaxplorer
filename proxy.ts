// Requête lue avant la page (Next 16 : proxy, ex-middleware). Sans « subtree » : sélection par
// défaut, faute de page d'accueil. Requête invalide : page d'erreur avec le statut 400, qu'une
// page de l'App Router ne sait pas donner elle-même.

import { type NextRequest, NextResponse } from "next/server";
import { parseQuery, QueryError, serializeQuery } from "./lib/query/query.ts";

/** Sélection à l'arrivée : une entrée de 1807 qui a ses trois champs et une emphase. */
const DEFAULT_QUERY = { subtree: "6867d742-fad7-5be1-81a3-423c67729033" };

export function proxy(request: NextRequest): NextResponse {
  const params = request.nextUrl.searchParams;
  const url = request.nextUrl.clone();
  if (!params.has("subtree")) {
    url.search = serializeQuery(DEFAULT_QUERY).toString();
    return NextResponse.redirect(url);
  }
  try {
    parseQuery(params);
    return NextResponse.next();
  } catch (error) {
    if (!(error instanceof QueryError)) throw error;
    url.pathname = "/bad-request";
    url.search = "";
    return NextResponse.rewrite(url, { status: 400 });
  }
}

export const config = { matcher: "/" };
