import type { Database } from "bun:sqlite";

export type Asn = (ip: string) => { asn: number; org: string } | null;

export function ipBytes(ip: string): Uint8Array {
  const bytes = new Uint8Array(16);
  if (!ip.includes(":")) {
    bytes[10] = bytes[11] = 0xff;
    ip.split(".").forEach((p, i) => (bytes[12 + i] = +p));
    return bytes;
  }
  const v4 = ip.match(/(\d+\.\d+\.\d+\.\d+)$/);
  if (v4) {
    const v4Bytes = ipBytes(v4[1]);
    ip = ip.slice(0, -v4[1].length) + ((v4Bytes[12] << 8) | v4Bytes[13]).toString(16) + ":" + ((v4Bytes[14] << 8) | v4Bytes[15]).toString(16);
  }
  const [head, tail] = ip.split("::");
  const headGroups = head ? head.split(":") : [];
  const tailGroups = tail === undefined ? [] : tail ? tail.split(":") : [];
  const groups = tail === undefined ? headGroups : [...headGroups, ...Array(8 - headGroups.length - tailGroups.length).fill("0"), ...tailGroups];
  groups.forEach((g, i) => {
    const n = parseInt(g, 16);
    bytes[i * 2] = n >> 8;
    bytes[i * 2 + 1] = n & 0xff;
  });
  return bytes;
}

export function buildAsn(tsv: string, db: Database) {
  db.run("CREATE TABLE r (start BLOB PRIMARY KEY, end BLOB NOT NULL, asn INTEGER NOT NULL) WITHOUT ROWID");
  db.run("CREATE TABLE org (asn INTEGER PRIMARY KEY, name TEXT)");
  const range = db.prepare("INSERT INTO r VALUES (?, ?, ?)");
  const org = db.prepare("INSERT OR IGNORE INTO org VALUES (?, ?)");
  db.transaction(() => {
    for (const line of tsv.split("\n")) {
      const [start, end, asn, , name] = line.split("\t");
      if (!name || asn === "0") continue;
      range.run(ipBytes(start), ipBytes(end), +asn);
      org.run(+asn, name);
    }
  })();
  return db;
}

export function asnLookup(db: Database): Asn {
  const q = db.prepare<{ end: Uint8Array; asn: number; name: string }, [Uint8Array]>(
    "SELECT r.end, asn, o.name FROM r JOIN org o USING (asn) WHERE r.start <= ? ORDER BY r.start DESC LIMIT 1",
  );
  return (ip) => {
    const bytes = ipBytes(ip);
    const row = q.get(bytes);
    // Some registry org names run to hundreds of characters; keep the evidence line readable.
    return row && Buffer.compare(row.end, bytes) >= 0 ? { asn: row.asn, org: row.name.slice(0, 80) } : null;
  };
}
