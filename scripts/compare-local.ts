// Essai des données en local : compare le moteur local (lib/local/engine.ts) à la version SQL,
// qui fait foi, sur un volume importé dans la base de développement, et chronomètre les deux.
// node scripts/compare-local.ts data/<volume>

import { isDeepStrictEqual } from "node:util";
import { connect } from "../lib/db/client.ts";
import { contextLocal, facetsLocal, indexVolume, resolveLocal } from "../lib/local/engine.ts";
import { facets } from "../lib/query/facets.ts";
import type { Query } from "../lib/query/query.ts";
import { context, resolve } from "../lib/query/resolve.ts";
import { readVolume } from "./read.ts";
import { toRows } from "./rows.ts";
import { toVolumeFile } from "./volume-file.ts";

const dir = process.argv[2];
if (!dir) throw new Error("usage : node scripts/compare-local.ts data/<volume>");

const file = toVolumeFile(toRows(readVolume(dir)));
let start = performance.now();
const volume = indexVolume(file);
console.log(`indexVolume : ${(performance.now() - start).toFixed(0)} ms`);

const sections = file.nodes.filter((n) => n.kind === "section");
const top = sections.filter((n) => n.parentId === null).map((n) => n.id);
const texts = [
  ...["rue", "paix", "rue de la paix", "boulanger", "épicier", "EPICIER", "oeuvre", "œ"],
  ...["—", "saint-", "fils aîné", "lefebvre", "de la", "veuve", "%", "_", "\\", "«"],
];
const largest = sections
  .map((s) => ({ s, n: resolveLocal(volume, { subtree: [s.id] }).nodes.length }))
  .toSorted((a, b) => b.n - a.n)
  .slice(0, 3)
  .map(({ s }) => s.id);

const queries: Query[] = [
  ...sections.map((s) => ({ subtree: [s.id] })),
  { subtree: top },
  ...texts.map((text) => ({ text })),
  ...texts.flatMap((text) => largest.map((id) => ({ text, subtree: [id] }))),
];

const sql = connect();
const time = { local: 0, sql: 0 };
const slowest = { local: { ms: 0, label: "" }, sql: { ms: 0, label: "" } };
const record = (side: "local" | "sql", ms: number, label: string) => {
  time[side] += ms;
  if (ms > slowest[side].ms) slowest[side] = { ms, label };
};
let failures = 0;
const check = async <T>(label: string, query: object, local: () => T, remote: () => Promise<T>) => {
  start = performance.now();
  const a = local();
  const what = `${label} ${JSON.stringify(query).slice(0, 60)}`;
  record("local", performance.now() - start, what);
  start = performance.now();
  const b = await remote();
  record("sql", performance.now() - start, what);
  // structuredClone : les lignes de postgres.js sont un tableau dérivé, avec count, command…
  if (!isDeepStrictEqual(structuredClone(a), structuredClone(b))) {
    failures++;
    console.log(`DIFFÉRENT ${label} ${JSON.stringify(query)}`);
  }
};
try {
  for (const q of queries) {
    await check(
      "resolve",
      q,
      () => resolveLocal(volume, q),
      () => resolve(sql, q),
    );
    await check(
      "context",
      q,
      () => contextLocal(volume, q),
      () => context(sql, q),
    );
  }
  for (const q of [{}, ...texts.map((text) => ({ text }))])
    await check(
      "facets",
      q,
      () => facetsLocal(volume, q),
      () => facets(sql, q),
    );
} finally {
  await sql.end();
}
const n = queries.length * 2 + texts.length + 1;
console.log(
  `${n} comparaisons, ${failures} différence(s) ; ` +
    `local ${time.local.toFixed(0)} ms, SQL ${time.sql.toFixed(0)} ms (cumulés, sans le réseau)`,
);
for (const side of ["local", "sql"] as const)
  console.log(`plus lente (${side}) : ${slowest[side].ms.toFixed(0)} ms, ${slowest[side].label}`);
