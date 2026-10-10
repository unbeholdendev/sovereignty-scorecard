import { Database } from "bun:sqlite";
import { join } from "node:path";
import { root } from "../root";
import { type Asn, asnLookup } from "../scanner/asn";

let lookup: Asn;

function open(): Asn {
  try {
    return asnLookup(new Database(process.env.ASN_DB ?? join(root, "asn.sqlite"), { readonly: true }));
  } catch {
    return () => null;
  }
}

export const realAsn: Asn = (ip) => (lookup ??= open())(ip);
