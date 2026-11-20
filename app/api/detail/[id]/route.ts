// Fiche d'un nœud, en JSON, que la vue Liste demande au premier dépliage d'une ligne
// (components/NodeDetails.tsx). Interne au site, pas l'API publique (docs/SPRINTS.md, « format
// de l'API JSON »). Identifiant mal formé : 400 ; inconnu : 404.

import { db } from "../../../../lib/db/server.ts";
import { isUuid } from "../../../../lib/query/query.ts";
import { detail, NodeNotFoundError } from "../../../../lib/query/resolve.ts";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) return Response.json({ error: "malformed node id" }, { status: 400 });
  try {
    return Response.json(await detail(db(), id.toLowerCase()));
  } catch (error) {
    if (error instanceof NodeNotFoundError)
      return Response.json({ error: "unknown node" }, { status: 404 });
    throw error;
  }
}
