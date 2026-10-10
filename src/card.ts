import type { ScanResult } from "./scanner/scan";

export function cardContent(result: ScanResult) {
  const top = result.detections
    .filter((d) => d.kind === "rented")
    .sort((a, b) => b.weight - a.weight || a.name.localeCompare(b.name))
    .slice(0, 3)
    .map((d) => (d.alternatives[0] ? `${d.name} → ${d.alternatives[0].name}` : d.name));
  const n = result.rentedCompanies.length;
  const line = result.score === null ? "Not enough data to score this site" : n ? `Rented from ${n} ${n === 1 ? "company" : "companies"}` : "Nothing rented detected";
  return { domain: result.domain, score: String(result.score ?? "?"), line, top };
}
