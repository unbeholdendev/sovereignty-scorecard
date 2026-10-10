import { realAsn } from "../src/adapters/asn";
import { realDns } from "../src/adapters/dns";
import { realHttp } from "../src/adapters/http";
import { type Fixture, scanDomain } from "../src/scanner/scan";

const fixture: Fixture = { dns: {}, http: null };
const result = await scanDomain(process.argv[2], {
  asn: realAsn,
  dns: { resolve: async (name, type) => (fixture.dns[`${type} ${name}`] = await realDns.resolve(name, type)) },
  http: {
    get: async (url, signal) => {
      const res = await realHttp.get(url, signal);
      fixture.http = { status: res.status, url, headers: Object.fromEntries(res.headers), body: await res.text() };
      return new Response(fixture.http.body, res);
    },
  },
});
await Bun.write(`test/fixtures/${result.domain}.json`, JSON.stringify(fixture, null, 2) + "\n");
console.log(`test/fixtures/${result.domain}.json`, result.status, result.score);
