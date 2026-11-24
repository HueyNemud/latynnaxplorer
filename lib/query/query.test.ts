import { describe, expect, it } from "vitest";
import { parseQuery, type Query, QueryError, queryUrl, serializeQuery } from "./query.ts";

const ID = "10000000-0000-0000-0000-000000000002";
const ID2 = "20000000-0000-0000-0000-00000000000a";

describe("parseQuery", () => {
  it("lit le nœud du sous-arbre", () => {
    expect(parseQuery(new URLSearchParams(`subtree=${ID}`))).toEqual({ subtree: [ID] });
  });

  it("met l'uuid en minuscules", () => {
    expect(parseQuery(new URLSearchParams("subtree=ABCDEF00-0000-0000-0000-00000000000A"))).toEqual(
      { subtree: ["abcdef00-0000-0000-0000-00000000000a"] },
    );
  });

  it("lit plusieurs sous-arbres, dans l'ordre, sans doublon", () => {
    expect(
      parseQuery(new URLSearchParams(`subtree=${ID2}&subtree=${ID}&subtree=${ID2.toUpperCase()}`)),
    ).toEqual({ subtree: [ID2, ID] });
  });

  it("ignore les paramètres inconnus", () => {
    expect(parseQuery(new URLSearchParams(`view=list&subtree=${ID}`))).toEqual({ subtree: [ID] });
  });

  it("lit le texte cherché, blancs réduits", () => {
    expect(parseQuery(new URLSearchParams("text=%20rue%20de%0Ala%20%20Paix%20"))).toEqual({
      text: "rue de la Paix",
    });
  });

  it("combine les critères", () => {
    expect(parseQuery(new URLSearchParams(`subtree=${ID}&text=paix`))).toEqual({
      subtree: [ID],
      text: "paix",
    });
  });

  it("lit les zones, dans l'ordre, sans doublon", () => {
    expect(parseQuery(new URLSearchParams("text=paix&in=addr&in=subj&in=addr"))).toEqual({
      text: "paix",
      zones: ["subj", "addr"],
    });
  });

  it("ignore les zones quand elles y sont toutes : tout le texte", () => {
    expect(parseQuery(new URLSearchParams("text=paix&in=other&in=addr&in=desc&in=subj"))).toEqual({
      text: "paix",
    });
  });

  it("ignore les zones sans texte", () => {
    expect(parseQuery(new URLSearchParams(`subtree=${ID}&text=&in=addr`))).toEqual({
      subtree: [ID],
    });
  });

  it.each([
    ["vide", "text="],
    ["blanc", "text=%20%20"],
  ])("ignore un texte %s", (_, search) => {
    expect(parseQuery(new URLSearchParams(`subtree=${ID}&${search}`))).toEqual({ subtree: [ID] });
  });

  it.each([
    ["sans paramètre", ""],
    ["avec un texte vide", "text="],
  ])("rend une requête vide %s", (_, search) => {
    expect(parseQuery(new URLSearchParams(search))).toEqual({});
  });

  it.each([
    ["vide", "subtree="],
    ["mal formé parmi d'autres", `subtree=${ID}&subtree=x`],
    ["mal formé", "subtree=10000000-0000-0000-0000"],
    ["avec des caractères en trop", `subtree=${ID}x`],
    ["texte répété", "text=a&text=b"],
    ["zone inconnue", "text=a&in=loc"],
  ])("refuse un paramètre %s", (_, search) => {
    expect(() => parseQuery(new URLSearchParams(search))).toThrow(QueryError);
  });
});

describe("serializeQuery", () => {
  it("écrit la requête en paramètres d'URL", () => {
    expect(serializeQuery({ subtree: [ID, ID2] }).toString()).toBe(`subtree=${ID}&subtree=${ID2}`);
  });

  it.each<Query>([
    { subtree: [ID] },
    { subtree: [ID, ID2] },
    { text: "rue de la Paix, 12 % _ \\" },
    { subtree: [ID], text: "paix" },
    { text: "paix", zones: ["desc", "other"] },
    {},
  ])("est relue à l'identique par parseQuery : %o", (query) => {
    expect(parseQuery(serializeQuery(query))).toEqual(query);
  });
});

describe("queryUrl", () => {
  it("ajoute les paramètres au chemin, et aucun sans critère", () => {
    expect(queryUrl("/", { subtree: [ID], text: "paix" })).toBe(`/?subtree=${ID}&text=paix`);
    expect(queryUrl("/", {})).toBe("/");
  });
});
