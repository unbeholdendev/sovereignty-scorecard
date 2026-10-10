import { Database } from "bun:sqlite";
import type { ScanResult } from "./scanner/scan";

const db = new Database(process.env.DATABASE_PATH ?? "scorecard.db");
db.run("CREATE TABLE IF NOT EXISTS results (domain TEXT PRIMARY KEY, scanned_at TEXT NOT NULL, result TEXT NOT NULL)");

export function getResult(domain: string): ScanResult | null {
  const row = db.query<{ result: string }, [string]>("SELECT result FROM results WHERE domain = ?").get(domain);
  return row && JSON.parse(row.result);
}

export function saveResult(result: ScanResult) {
  db.query("INSERT OR REPLACE INTO results VALUES (?, ?, ?)").run(result.domain, result.scannedAt, JSON.stringify(result));
}

db.run("CREATE TABLE IF NOT EXISTS cards (domain TEXT PRIMARY KEY, scanned_at TEXT NOT NULL, png BLOB NOT NULL)");

export function getCard(result: ScanResult) {
  return db.query<{ png: Uint8Array }, [string, string]>("SELECT png FROM cards WHERE domain = ? AND scanned_at = ?").get(result.domain, result.scannedAt)?.png;
}

export function saveCard(result: ScanResult, png: Uint8Array) {
  db.query("INSERT OR REPLACE INTO cards VALUES (?, ?, ?)").run(result.domain, result.scannedAt, png);
}

db.run("CREATE TABLE IF NOT EXISTS signups (email TEXT NOT NULL, domain TEXT NOT NULL, consented_at TEXT NOT NULL, consent_text TEXT NOT NULL, PRIMARY KEY (email, domain))");

export function saveSignup(email: string, domain: string, consentText: string) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "invalid";
  const { changes } = db.query("INSERT OR IGNORE INTO signups VALUES (?, ?, ?, ?)").run(email.toLowerCase(), domain, new Date().toISOString(), consentText);
  return changes ? "saved" : "duplicate";
}

db.run("CREATE TABLE IF NOT EXISTS hidden (domain TEXT PRIMARY KEY)");

export function hide(domain: string) {
  db.query("INSERT OR IGNORE INTO hidden VALUES (?)").run(domain);
}

export function isHidden(domain: string) {
  return db.query("SELECT 1 FROM hidden WHERE domain = ?").get(domain) !== null;
}

export function recentResults(limit = 20): ScanResult[] {
  return db
    .query<{ result: string }, [number]>(
      `SELECT result FROM results
       WHERE domain NOT IN (SELECT domain FROM hidden)
         AND result ->> '$.status' = 'ok'
         AND EXISTS (SELECT 1 FROM json_each(result, '$.detections') WHERE value ->> '$.kind' != 'unscored')
       ORDER BY scanned_at DESC LIMIT ?`,
    )
    .all(limit)
    .map((row) => JSON.parse(row.result));
}
