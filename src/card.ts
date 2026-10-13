import type { ScanResult } from "./scanner/scan";

export function cardContent(result: ScanResult) {
  const top = result.detections
    .filter((d) => d.kind === "rented")
    .sort((a, b) => b.weight - a.weight || a.name.localeCompare(b.name))
    .slice(0, 3)
    .map((d) => ({ name: d.name, alternative: d.alternatives[0]?.name ?? null }));
  const n = result.rentedCompanies.length;
  const line = result.score === null ? "Not enough data to score this site" : n ? `Rented from ${n} ${n === 1 ? "company" : "companies"}` : "Nothing rented detected";
  const description = [line, ...top.map((t) => (t.alternative ? `${t.name}, open source option ${t.alternative}` : t.name))].join(". ");
  return { domain: result.domain, score: result.score, rented: n, line, top, description };
}
