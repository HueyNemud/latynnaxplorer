// Petit volume conforme aux schémas numrev, pour les tests. Ordre de lecture :
//   p. 1 : titre T1, entrée E3 (sous T1, ligne sans boîte), titre T2 (sous T1), entrée E1, début de E2
//   p. 2 : élément hors champ O1 (titre courant, sous T2), fin de E2

const ROOT = "00000000-0000-0000-0000-000000000000";
export const T1 = "10000000-0000-0000-0000-000000000001";
export const T2 = "10000000-0000-0000-0000-000000000002";
export const E1 = "20000000-0000-0000-0000-000000000001";
export const E2 = "20000000-0000-0000-0000-000000000002";
export const E3 = "20000000-0000-0000-0000-000000000003";
export const O1 = "40000000-0000-0000-0000-000000000001";

const header = {
  volume: "TEST",
  source: { pdf: "TEST.pdf", sha256: null },
  ranges: [{ name: "1-2", first_page: 1, last_page: 2 }],
  coordinates: { width: 1000, height: 1000, origin: "top-left" },
  provenance: {
    numrev: { commit: null, uncommitted_changes: null },
    exported_at: "2026-10-30T00:00:00+00:00",
    inputs: {},
  },
};

function line(key: string, bbox: number[] | null, cls = "B-ENTRY") {
  return {
    id: `1-2:${key}`,
    key,
    uid: null,
    block: "1-2:1.1",
    origin: "ocr",
    class: cls,
    text: key,
    ocr_text: key,
    bbox_estimate: bbox,
    ocr: null,
    labeling: null,
    corrected: false,
  };
}

function page(number: number, lines: ReturnType<typeof line>[]) {
  const block = { id: `1-2:${number}.1`, label: "List-Group", bbox: [0, 0, 1000, 1000] };
  return {
    id: `1-2:${number}`,
    page: number,
    range: "1-2",
    size: [1000, 1600],
    blocks: [block],
    lines,
  };
}

function title(id: string, parent: string, heading: string, key: string) {
  const lines = [{ line: `1-2:${key}`, start: 0, end: heading.length }];
  return { id, parent, range: "1-2", pages: [1], level: 1, heading, text: heading, lines };
}

function entry(id: string, text: string, keys: string[], pages: number[], parent = T2) {
  return {
    id,
    parent,
    range: "1-2",
    pages,
    kind: "single",
    text,
    lines: keys.map((key) => ({ line: `1-2:${key}`, start: 0, end: 1 })),
    spans: [] as ReturnType<typeof span>[],
    members: null,
    quality: {
      ocr_confidence: null,
      ocr_doubtful: false,
      ner_confidence: null,
      ner_suspect: [],
      corrected_lines: false,
      corrected_ner: false,
    },
  };
}

function span(id: string, label: string, start: number, end: number, text: string, key: string) {
  const pieces = [{ line: `1-2:${key}`, start, end }];
  return { id, label, start, end, text, normalized: text, pieces };
}

/** Les trois fichiers du volume TEST, recréés à chaque appel. */
export function fixture() {
  const e1 = entry(E1, "Dupont, rue de la Paix, 12.", ["e1"], [1]);
  e1.spans = [
    span("30000000-0000-0000-0000-000000000001", "SUBJ", 0, 6, "Dupont", "e1"),
    span("30000000-0000-0000-0000-000000000002", "ADDR", 8, 27, "rue de la Paix, 12.", "e1"),
  ];
  return {
    volume: {
      identifier: "TEST",
      title: "Annuaire de test",
      creator: null,
      subject: null,
      description: null,
      publisher: null,
      contributor: null,
      date: null,
      type: "Text",
      format: "application/pdf",
      source: null,
      language: "fr",
      relation: null,
      coverage: null,
      rights: null,
      temporal: { start: "1807-01-01", end: "1807-12-31" },
    },
    document: {
      schema: "numrev-document/1",
      ...header,
      pages: [
        page(1, [
          line("t1", [100, 10, 900, 30]),
          line("e3", null),
          line("t2", [100, 40, 600, 60]),
          line("e1", [100, 70, 500, 90]),
          line("e2a", [120, 950, 480, 970]),
        ]),
        page(2, [line("o1", [400, 0, 600, 8], "OUT OF SCOPE"), line("e2b", [100, 10, 300, 30])]),
      ],
    },
    structure: {
      schema: "numrev-structure/2",
      ...header,
      root: ROOT,
      titles: [title(T1, ROOT, "PARTIE.", "t1"), title(T2, T1, "RUBRIQUE.", "t2")],
      entries: [
        e1,
        entry(E2, "Martin, rue Longue, 3.", ["e2a", "e2b"], [1, 2]),
        entry(E3, "Durand.", ["e3"], [1], T1),
      ],
      out_of_scope: [
        {
          id: O1,
          parent: T2,
          range: "1-2",
          pages: [2],
          text: "ALMANACH",
          lines: [{ line: "1-2:o1", start: 0, end: 8 }],
        },
      ],
    },
  };
}
