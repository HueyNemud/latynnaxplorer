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

  it("lit le texte cherché, blancs réduits", () => {
    expect(parseQuery(new URLSearchParams("text=%20rue%20de%0Ala%20%20Paix%20"))).toEqual({
      text: "rue de la Paix",
    });
  });

  it("combine les critères", () => {
    expect(parseQuery(new URLSearchParams(`subtree=${ID}&text=paix`))).toEqual({
      subtree: ID,
      text: "paix",
    });
  });

  it.each([
    ["sans paramètre", ""],
    ["avec un texte vide", "text="],
    ["avec un texte blanc", "text=%20%20"],
  ])("rend une requête vide %s", (_, search) => {
    expect(parseQuery(new URLSearchParams(search))).toEqual({});
  });

  it.each([
    ["vide", "subtree="],
    ["répété", `subtree=${ID}&subtree=${ID}`],
    ["mal formé", "subtree=10000000-0000-0000-0000"],
    ["avec des caractères en trop", `subtree=${ID}x`],
    ["texte répété", "text=a&text=b"],
  ])("refuse un paramètre %s", (_, search) => {
    expect(() => parseQuery(new URLSearchParams(search))).toThrow(QueryError);
  });
});

describe("serializeQuery", () => {
  it("écrit la requête en paramètres d'URL", () => {
    expect(serializeQuery({ subtree: ID }).toString()).toBe(`subtree=${ID}`);
  });

  it.each([
    { subtree: ID },
    { text: "rue de la Paix, 12 % _ \\" },
    { subtree: ID, text: "paix" },
    {},
  ])("est relue à l'identique par parseQuery : %o", (query) => {
    expect(parseQuery(serializeQuery(query))).toEqual(query);
  });
});
