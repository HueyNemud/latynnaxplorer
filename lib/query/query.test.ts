import { describe, expect, it } from "vitest";
import { parseQuery, QueryError, serializeQuery } from "./query.ts";

const ID = "10000000-0000-0000-0000-000000000002";

describe("parseQuery", () => {
  it("lit le nœud du sous-arbre", () => {
    expect(parseQuery(new URLSearchParams(`subtree=${ID}`))).toEqual({ subtree: ID });
  });

  it("met l'uuid en minuscules", () => {
    expect(parseQuery(new URLSearchParams("subtree=ABCDEF00-0000-0000-0000-00000000000A"))).toEqual(
      { subtree: "abcdef00-0000-0000-0000-00000000000a" },
    );
  });

  it("ignore les paramètres inconnus", () => {
    expect(parseQuery(new URLSearchParams(`view=list&subtree=${ID}`))).toEqual({ subtree: ID });
  });

  it.each([
    ["absent", ""],
    ["vide", "subtree="],
    ["répété", `subtree=${ID}&subtree=${ID}`],
    ["mal formé", "subtree=10000000-0000-0000-0000"],
    ["avec des caractères en trop", `subtree=${ID}x`],
  ])("refuse un paramètre %s", (_, search) => {
    expect(() => parseQuery(new URLSearchParams(search))).toThrow(QueryError);
  });
});

describe("serializeQuery", () => {
  it("écrit la requête en paramètres d'URL", () => {
    expect(serializeQuery({ subtree: ID }).toString()).toBe(`subtree=${ID}`);
  });

  it("est relue à l'identique par parseQuery", () => {
    const query = { subtree: ID };
    expect(parseQuery(serializeQuery(query))).toEqual(query);
  });
});
