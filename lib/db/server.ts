// Connexion partagée par le serveur Next : un pool par processus. En développement, le
// rechargement à chaud réévalue les modules : le pool est gardé sur globalThis pour ne pas en
// ouvrir un nouveau à chaque modification.

import type postgres from "postgres";
import { connect } from "./client.ts";

const shared = globalThis as typeof globalThis & { latynnaxplorerSql?: postgres.Sql };

export function db(): postgres.Sql {
  shared.latynnaxplorerSql ??= connect();
  return shared.latynnaxplorerSql;
}
