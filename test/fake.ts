import { Database } from "bun:sqlite";
import { asnLookup, buildAsn } from "../src/scanner/asn";
import type { Fixture } from "../src/scanner/scan";

const asn = asnLookup(buildAsn(await Bun.file(`${import.meta.dir}/fixtures/ip2asn.tsv`).text(), new Database()));

export function fake(fixture: Fixture) {
  const httpCalls: string[] = [];
  return {
    httpCalls,
    asn,
    dns: { resolve: async (name: string, type: string) => fixture.dns[`${type} ${name}`] ?? [] },
    http: {
      get: async (url: string) => {
        httpCalls.push(url);
        if (!fixture.http) throw new Error("unreachable");
        const { status, headers, body } = fixture.http;
        return new Response(body, { status, headers });
      },
    },
  };
}
