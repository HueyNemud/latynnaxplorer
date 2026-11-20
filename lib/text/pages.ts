// Pages d'un nœud, telles que la fiche les écrit (components/NodeDetail.tsx).

/** « p. 60 », « pp. 60–61 », « pp. 60, 62 » ; « unknown page » sans page. */
export function pages(numbers: readonly number[]): string {
  const [first] = numbers;
  if (first === undefined) return "unknown page";
  if (numbers.length === 1) return `p. ${first}`;
  const consecutive = numbers.every((n, i) => n === first + i);
  const last = numbers.at(-1);
  return consecutive ? `pp. ${first}–${last}` : `pp. ${numbers.join(", ")}`;
}
