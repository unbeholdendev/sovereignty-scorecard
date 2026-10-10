import { expect, test } from "bun:test";
import { cardContent } from "../src/card";
import type { Detection, ScanResult } from "../src/scanner/scan";

const rented = (name: string, weight: number, alt?: string): Detection => ({
  id: name, name, category: "x", company: `${name} Inc`, kind: "rented", weight, evidence: [],
  alternatives: alt ? [{ name: alt, repo: "", selfHostUrl: "", articles: [] }] : [],
});

const result = (detections: Detection[], score: number | null): ScanResult => ({
  domain: "example.com", scannedAt: "2026-10-10T00:00:00Z", status: "ok", detections, score,
  rentedCompanies: [...new Set(detections.filter((d) => d.kind === "rented").map((d) => d.company!))],
});

test("top three are the heaviest rented items, ties broken by name, each with its first alternative", () => {
  const card = cardContent(result([
    rented("Intercom", 1, "Chatwoot"),
    rented("Google Analytics", 1, "Plausible"),
    rented("Vercel", 3, "Coolify"),
    rented("Google Fonts", 1),
    { ...rented("Stalwart", 3), kind: "owned" },
  ], 40));
  expect(card.top).toEqual(["Vercel → Coolify", "Google Analytics → Plausible", "Google Fonts"]);
  expect(card.score).toBe("40");
  expect(card.line).toBe("Rented from 4 companies");
});

test("not enough data shows that instead of a score", () => {
  const card = cardContent({ ...result([], null), status: "unreachable" });
  expect(card.score).toBe("?");
  expect(card.line).toBe("Not enough data to score this site");
  expect(card.top).toEqual([]);
});

test("nothing rented says so instead of an empty list", () => {
  const card = cardContent(result([{ ...rented("Stalwart", 3), kind: "owned" }], 100));
  expect(card.score).toBe("100");
  expect(card.line).toBe("Nothing rented detected");
});

test("one company is singular", () => {
  expect(cardContent(result([rented("Vercel", 3)], 0)).line).toBe("Rented from 1 company");
});
