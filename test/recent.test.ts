import { expect, test } from "bun:test";
import type { Detection, ScanResult } from "../src/scanner/scan";

process.env.DATABASE_PATH = ":memory:";
const { hide, isHidden, recentResults, saveResult } = await import("../src/store");

const mail = (kind: Detection["kind"]): Detection => ({
  id: "x", name: "X", category: "mail", kind, weight: 3, evidence: [], alternatives: [],
});
const result = (domain: string, scannedAt: string, status: ScanResult["status"], detections: Detection[]): ScanResult => ({
  domain, scannedAt, status, detections, score: null, rentedCompanies: [],
});

test("recent scans are ok, scored, visible and newest first", () => {
  saveResult(result("old.com", "2026-10-10T10:00:00Z", "ok", [mail("rented")]));
  saveResult(result("new.com", "2026-10-10T12:00:00Z", "ok", [mail("unscored"), mail("owned")]));
  saveResult(result("unscored.com", "2026-10-10T13:00:00Z", "ok", [mail("unscored")]));
  saveResult(result("empty.com", "2026-10-10T13:00:00Z", "ok", []));
  saveResult(result("down.com", "2026-10-10T13:00:00Z", "unreachable", [mail("rented")]));
  saveResult(result("refused.com", "2026-10-10T13:00:00Z", "refused", [mail("rented")]));
  saveResult(result("hidden.com", "2026-10-10T13:00:00Z", "ok", [mail("rented")]));
  hide("hidden.com");

  expect(recentResults().map((r) => r.domain)).toEqual(["new.com", "old.com"]);
  expect(isHidden("hidden.com")).toBe(true);
  expect(isHidden("new.com")).toBe(false);
});
