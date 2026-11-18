import { afterAll, describe, expect, inject, it } from "vitest";
import { connect } from "../lib/db/client.ts";
import { fixture } from "./fixture.ts";
import { loadRows } from "./load.ts";
import { toRows } from "./rows.ts";
import { validateVolume } from "./validate.ts";

const sql = connect(inject("databaseUrl"));
afterAll(() => sql.end());

async function counts() {
  const [row] = await sql<{ volumes: number; nodes: number; spans: number; anchors: number }[]>`
    SELECT (SELECT count(*)::int FROM volume) AS volumes,
           (SELECT count(*)::int FROM node) AS nodes,
           (SELECT count(*)::int FROM span) AS spans,
           (SELECT count(*)::int FROM anchor) AS anchors`;
  return row;
}

describe("loadRows", () => {
  it("remplace le volume en entier quand on le recharge", async () => {
    // la base de test contient déjà la fixture : la recharger ne doit rien dupliquer
    await loadRows(sql, toRows(validateVolume(fixture())));
    expect(await counts()).toEqual({ volumes: 1, nodes: 6, spans: 2, anchors: 6 });
  });
});
