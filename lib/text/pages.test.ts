import { describe, expect, it } from "vitest";
import { pages } from "./pages.ts";

describe("pages", () => {
  it("écrit une page seule", () => {
    expect(pages([60])).toBe("p. 60");
  });

  it("écrit des pages consécutives en intervalle", () => {
    expect(pages([60, 61])).toBe("pp. 60–61");
    expect(pages([60, 61, 62])).toBe("pp. 60–62");
  });

  it("énumère des pages qui ne se suivent pas", () => {
    expect(pages([60, 62])).toBe("pp. 60, 62");
  });

  it("dit qu'il n'y a pas de page", () => {
    expect(pages([])).toBe("unknown page");
  });
});
