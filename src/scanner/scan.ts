import { BlockList, isIP, isIPv6 } from "node:net";
import { getDomain } from "tldts";
import type { Asn } from "./asn";
import { detectHomepage } from "./homepage";
import { detectHosting } from "./hosting";
import { dkimSelectors, mailRules } from "./rules/mail";
import { nsRules } from "./rules/ns";
import { verificationRules } from "./rules/verification";
import { type Alternative, catalogue } from "./catalogue";
import { detection } from "./weights";

export type RecordType = "A" | "AAAA" | "MX" | "TXT" | "NS" | "CNAME";
export type Dns = { resolve(name: string, type: RecordType): Promise<string[]> };
export type Page = { status: number; url: string; headers: Record<string, string>; body: string };
export type Http = { get(url: string, signal: AbortSignal): Promise<Response> };
export type Fixture = { dns: Record<string, string[]>; http: Page | null };

export type Evidence = { source: "dns" | "header" | "html" | "asn"; detail: string };
export type Detection = {
  id: string;
  name: string;
  category: string;
  company?: string;
  kind: "owned" | "rented" | "unscored";
  weight: number;
  evidence: Evidence[];
  alternatives: Alternative[];
};

export type ScanResult = {
  domain: string;
  scannedAt: string;
  status: "ok" | "refused" | "unreachable";
  detections: Detection[];
  score: number | null;
  rentedCompanies: string[];
};

const internal = new BlockList();
for (const [net, bits] of [["0.0.0.0", 8], ["10.0.0.0", 8], ["127.0.0.0", 8], ["169.254.0.0", 16], ["172.16.0.0", 12], ["192.168.0.0", 16]] as const)
  internal.addSubnet(net, bits, "ipv4");
// ::/127 is exactly :: and ::1.
for (const [net, bits] of [["::", 127], ["fc00::", 7], ["fe80::", 10]] as const)
  internal.addSubnet(net, bits, "ipv6");

const maxBody = 2 * 1024 * 1024;

const isWithin = (host: string, domain: string) => host === domain || host.endsWith(`.${domain}`);

export function normalise(input: string) {
  return getDomain(input.trim(), { allowPrivateDomains: true });
}

type Rule = { id: string; name: string; company: string; hosts: (string | RegExp)[] };
type Provider = { id: string; name: string; company?: string; kind: Detection["kind"] };

const bareHost = (host: string) => host.toLowerCase().replace(/\.$/, "");
const asProvider = (r: { id: string; name: string; company: string }, kind: Provider["kind"]): Provider =>
  ({ id: r.id, name: r.name, company: r.company, kind });

function provider(rules: Rule[], host: string, domain: string, category: string, ownName: string): Provider {
  const rule = rules.find((r) => r.hosts.some((h) => (typeof h === "string" ? isWithin(host, h) : h.test(host))));
  if (rule) return asProvider(rule, "rented");
  if (isWithin(host, domain)) return { id: `own-${category}`, name: ownName, kind: "owned" };
  const company = normalise(host) ?? host;
  return { id: `other-${category}:${company}`, name: "Other third party", company, kind: "rented" };
}

function add(found: Map<string, Detection>, category: string, p: Provider, detail: string) {
  const d = found.get(p.id) ?? detection({ ...p, category, evidence: [] });
  d.evidence.push({ source: "dns", detail });
  found.set(p.id, d);
}

export async function scanDomain(input: string, { dns, http, asn }: { dns: Dns; http: Http; asn: Asn }): Promise<ScanResult> {
  const domain = normalise(input);
  if (!domain) throw new Error(`Not a domain: ${input}`);
  const scannedAt = new Date().toISOString();
  const refused = { domain, scannedAt, status: "refused" as const, detections: [], score: null, rentedCompanies: [] };
  const ips = await addresses(dns, domain);
  if (ips.some(isPrivate)) return refused;
  const page = await fetchPage(dns, http, `https://${domain}/`).catch(() => null);
  if (page === "refused") return refused;
  const found = new Map<string, Detection>();
  const mail = (host: string) => provider(mailRules, bareHost(host), domain, "mail", "Own mail server");
  for (const record of await dns.resolve(domain, "NS"))
    add(found, "dns", provider(nsRules, bareHost(record), domain, "dns", "Own nameservers"), `NS ${record}`);
  for (const record of await dns.resolve(domain, "MX"))
    add(found, "mail", mail(record.split(" ").pop()!), `MX ${record}`);
  const txt = await dns.resolve(domain, "TXT");
  for (const record of txt.filter((r) => r.startsWith("v=spf1 ")))
    for (const [term, host] of record.matchAll(/(?:include:|redirect=)(\S+)/g))
      if (!isWithin(bareHost(host), domain))
        add(found, "mail", mail(host), `SPF ${term}`);
  for (const record of txt) {
    const rule = verificationRules.find((r) => r.prefixes.some((p) => record.startsWith(p)));
    if (rule) add(found, "account", asProvider(rule, "unscored"), `TXT ${record}`);
  }
  const keys = await Promise.all(dkimSelectors.map(async (selector) => {
    const name = `${selector}._domainkey.${domain}`;
    return { selector, name, cname: await dns.resolve(name, "CNAME"), txt: await dns.resolve(name, "TXT") };
  }));
  for (const { selector, name, cname: [target], txt: [key] } of keys) {
    const rule = mailRules.find((r) => r.selector === selector);
    if (target) add(found, "mail", mail(target), `CNAME ${name} ${target}`);
    else if (key && rule) add(found, "mail", asProvider(rule, "rented"), `TXT ${name} ${key}`);
  }
  const homepage = page ? await detectHomepage(page) : [];
  const hosting = page && ips[0] ? [detectHosting(page.headers, ips[0], asn, homepage)] : [];
  const detections = [...found.values(), ...hosting, ...homepage.filter((d) => d.id !== hosting[0]?.id)].map(attachCatalogue);
  return { domain, scannedAt, status: page ? "ok" : "unreachable", detections, ...score(detections) };
}

const addresses = async (dns: Dns, host: string) => [...(await dns.resolve(host, "A")), ...(await dns.resolve(host, "AAAA"))];
const isPrivate = (ip: string) => internal.check(ip, isIPv6(ip) ? "ipv6" : "ipv4");

async function fetchPage(dns: Dns, http: Http, url: string): Promise<Page | "refused"> {
  const signal = AbortSignal.timeout(10_000);
  let res = await http.get(url, signal);
  const location = res.status >= 300 && res.status < 400 && res.headers.get("location");
  if (location) {
    url = new URL(location, url).href;
    const host = new URL(url).hostname.replace(/^\[|\]$/g, "");
    const ips = isIP(host) ? [host] : await addresses(dns, host);
    if (!ips.length || ips.some(isPrivate)) return "refused";
    res = await http.get(url, signal);
  }
  const chunks: Uint8Array[] = [];
  let size = 0;
  for await (const chunk of res.body ?? []) {
    chunks.push(chunk);
    if ((size += chunk.length) >= maxBody) break;
  }
  const body = Buffer.concat(chunks).subarray(0, maxBody).toString();
  return { status: res.status, url, headers: Object.fromEntries(res.headers), body };
}

function attachCatalogue(d: Detection): Detection {
  const tool = catalogue.find((t) => t.matches.includes(d.id));
  if (!tool) return d;
  return { ...d, company: d.company ?? tool.company, alternatives: d.kind === "rented" ? tool.alternatives.map(({ licence, ...a }) => a) : [] };
}

function score(detections: Detection[]) {
  const sum = (kinds: string[]) => detections.filter((d) => kinds.includes(d.kind)).reduce((n, d) => n + d.weight, 0);
  const total = sum(["owned", "rented"]);
  const rented = detections.filter((d) => d.kind === "rented" && d.company).map((d) => d.company!);
  return { score: total ? Math.round((sum(["owned"]) / total) * 100) : null, rentedCompanies: [...new Set(rented)] };
}
