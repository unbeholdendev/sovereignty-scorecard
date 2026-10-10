import { expect, test } from "bun:test";
import { isFresh, rateLimiter, rescanAt } from "../src/limits";

const scannedAt = "2026-10-10T12:00:00.000Z";
const at = (iso: string) => new Date(iso).getTime();

test("a result is fresh for 24 hours", () => {
  expect(isFresh(scannedAt, at("2026-10-11T11:59:59.000Z"))).toBe(true);
  expect(isFresh(scannedAt, at("2026-10-11T12:00:00.000Z"))).toBe(false);
});

test("rescan opens an hour after the last scan", () => {
  expect(rescanAt(scannedAt)).toBe(at("2026-10-10T13:00:00.000Z"));
});

test("an IP gets 10 scans per minute", () => {
  const allow = rateLimiter(10, 60_000);
  const t = at(scannedAt);
  for (let i = 0; i < 10; i++) expect(allow("1.2.3.4", t + i)).toBe(true);
  expect(allow("1.2.3.4", t + 59_999)).toBe(false);
  expect(allow("5.6.7.8", t + 59_999)).toBe(true);
  expect(allow("1.2.3.4", t + 60_000)).toBe(true);
});
