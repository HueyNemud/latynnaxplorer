import { describe, expect, it } from "vitest";
import { fixture } from "./fixture.ts";
import { validateVolume } from "./validate.ts";

describe("validateVolume", () => {
  it("accepte un volume conforme", () => {
    expect(validateVolume(fixture()).volume.identifier).toBe("TEST");
  });

  it("refuse une entrée à laquelle manque un champ obligatoire, en donnant son chemin", () => {
    const files = fixture();
    const { text: _, ...withoutText } = files.structure.entries[0] ?? {};
    files.structure.entries[0] = withoutText as (typeof files.structure.entries)[0];
    expect(() => validateVolume(files)).toThrow(/^structure\.json : non conforme.*\/entries\/0/);
  });

  it("refuse une autre version du format numrev", () => {
    const files = fixture();
    files.document.schema = "numrev-document/2";
    expect(() => validateVolume(files)).toThrow(/^document\.json : non conforme/);
  });

  it("refuse un intervalle temporel qui n'est pas en AAAA-MM-JJ", () => {
    const files = fixture();
    files.volume.temporal.start = "1807";
    expect(() => validateVolume(files)).toThrow(/^volume\.json : non conforme.*\/temporal\/start/);
  });

  it("refuse des fichiers qui ne décrivent pas le même volume", () => {
    const files = fixture();
    files.structure.volume = "AUTRE";
    expect(() => validateVolume(files)).toThrow("structure.json : volume « AUTRE »");
  });
});
