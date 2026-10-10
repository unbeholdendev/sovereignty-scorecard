import { Database } from "bun:sqlite";
import { rename, rm } from "node:fs/promises";
import { join } from "node:path";
import { root } from "../src/root";
import { buildAsn } from "../src/scanner/asn";

const out = process.env.ASN_DB ?? join(root, "asn.sqlite");
const res = await fetch("https://iptoasn.com/data/ip2asn-combined.tsv.gz");
if (!res.ok) throw new Error(`iptoasn: ${res.status}`);
const tsv = new TextDecoder().decode(Bun.gunzipSync(await res.arrayBuffer()));
await rm(`${out}.new`, { force: true });
const db = buildAsn(tsv, new Database(`${out}.new`));
db.run("VACUUM");
db.close();
await rename(`${out}.new`, out);
console.log(out);
