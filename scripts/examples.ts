import { realAsn } from "../src/adapters/asn";
import { realDns } from "../src/adapters/dns";
import { realHttp } from "../src/adapters/http";
import { scanDomain } from "../src/scanner/scan";

const domains = ["unbeholden.dev", "proton.me", "bbc.co.uk", "debian.org", "linear.app", "europa.eu"];
const results = await Promise.all(domains.map((d) => scanDomain(d, { dns: realDns, http: realHttp, asn: realAsn })));
await Bun.write("src/examples.json", JSON.stringify(results, null, 2) + "\n");
