// Requête lue avant la page (Next 16 : proxy, ex-middleware). Requête invalide : page d'erreur
// avec le statut 400, qu'une page de l'App Router ne sait pas donner elle-même. Sans critère, la
// requête est valide : rien n'est sélectionné.

import { type NextRequest, NextResponse } from "next/server";
import { parseQuery, QueryError } from "./lib/query/query.ts";

export function proxy(request: NextRequest): NextResponse {
  try {
    parseQuery(request.nextUrl.searchParams);
    return NextResponse.next();
  } catch (error) {
    if (!(error instanceof QueryError)) throw error;
    const url = request.nextUrl.clone();
    url.pathname = "/bad-request";
    url.search = "";
    return NextResponse.rewrite(url, { status: 400 });
  }
}

export const config = { matcher: "/" };
