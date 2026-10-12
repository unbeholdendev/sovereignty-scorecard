import { expect, jest, test } from "bun:test";
import { realAsn } from "../src/adapters/asn";
import { type ScanResult, scanDomain } from "../src/scanner/scan";
import { fake } from "./fake";

const page = { status: 200, url: "https://example.com/", headers: {}, body: "" };

test.each(["Example.com", "www.example.com", "https://www.example.com/x"])(
  "%s normalises to example.com",
  async (input) => {
    const result = await scanDomain(input, fake({ dns: {}, http: page }));
    expect(result.domain).toBe("example.com");
  },
);

test.each([
  ["A", "10.0.0.1"],
  ["A", "127.0.0.1"],
  ["A", "169.254.1.1"],
  ["A", "192.168.1.1"],
  ["AAAA", "::1"],
  ["AAAA", "fe80::1"],
  ["AAAA", "fd00::1"],
  ["AAAA", "::ffff:10.0.0.1"],
])("%s %s is refused without fetching", async (type, ip) => {
  const adapters = fake({ dns: { [`${type} example.com`]: [ip] }, http: page });
  const result = await scanDomain("example.com", adapters);
  expect(result.status).toBe("refused");
  expect(adapters.httpCalls).toEqual([]);
});

test("a public address is fetched", async () => {
  const adapters = fake({ dns: { "A example.com": ["93.184.215.14"] }, http: page });
  expect((await scanDomain("example.com", adapters)).status).toBe("ok");
  expect(adapters.httpCalls).toEqual(["https://example.com/"]);
});

test("a failed fetch is unreachable", async () => {
  const result = await scanDomain("example.com", fake({ dns: {}, http: null }));
  expect(result.status).toBe("unreachable");
});

const mx = (...records: string[]) => fake({ dns: { "MX example.com": records }, http: page });

test("Google Workspace MX is rented mail with its records as evidence and catalogued alternatives", async () => {
  const result = await scanDomain("example.com", mx("1 aspmx.l.google.com", "5 alt1.aspmx.l.google.com"));
  expect(result.detections).toMatchObject([
    {
      id: "google-workspace",
      name: "Google Workspace",
      category: "mail",
      company: "Google",
      kind: "rented",
      weight: 3,
      evidence: [
        { source: "dns", detail: "MX 1 aspmx.l.google.com" },
        { source: "dns", detail: "MX 5 alt1.aspmx.l.google.com" },
      ],
      alternatives: [
        {
          name: "Stalwart",
          repo: "https://github.com/stalwartlabs/stalwart",
          selfHostUrl: "https://stalw.art/docs/install/get-started",
          articles: ["https://unbeholden.dev/blog/self-hosting-email-with-stalwart"],
        },
        { name: "Mailcow", managedUrl: "https://www.servercow.de" },
        { name: "Mox" },
      ],
    },
  ]);
});

test.each([
  ["example-com.mail.protection.outlook.com", "microsoft-365"],
  ["mail.protonmail.ch", "proton"],
  ["in1-smtp.messagingengine.com", "fastmail"],
  ["route1.mx.cloudflare.net", "cloudflare-email-routing"],
  ["mx.zoho.eu", "zoho"],
  ["smtp.google.com", "google-workspace"],
])("MX %s is %s", async (host, id) => {
  const [detection] = (await scanDomain("example.com", mx(`10 ${host}`))).detections;
  expect(detection).toMatchObject({ id, kind: "rented", category: "mail" });
});

test("MX under the scanned domain is owned mail", async () => {
  const [detection] = (await scanDomain("example.com", mx("10 mail.example.com"))).detections;
  expect(detection).toMatchObject({
    kind: "owned",
    category: "mail",
    weight: 3,
    evidence: [{ source: "dns", detail: "MX 10 mail.example.com" }],
  });
});

test("an unmatched MX elsewhere is other third party with the raw record", async () => {
  const [detection] = (await scanDomain("example.com", mx("10 mx1.mailhost.net."))).detections;
  expect(detection).toMatchObject({
    name: "Other third party",
    category: "mail",
    company: "mailhost.net",
    kind: "rented",
    evidence: [{ source: "dns", detail: "MX 10 mx1.mailhost.net." }],
  });
});

test("owned mail alone scores 100", async () => {
  expect((await scanDomain("example.com", mx("10 mail.example.com"))).score).toBe(100);
});

test("one owned and two rented mail providers score 33 and name the companies", async () => {
  const result = await scanDomain("example.com", mx("10 mail.example.com", "20 aspmx.l.google.com", "30 mx.zoho.eu"));
  expect(result.score).toBe(33);
  expect(result.rentedCompanies).toEqual(["Google", "Zoho"]);
});

test("nothing scored is not enough data", async () => {
  const result = await scanDomain("example.com", mx());
  expect(result.score).toBeNull();
  expect(result.rentedCompanies).toEqual([]);
});

test.each([
  ["fastmail.com", ["fastmail", "own-hosting"], 100],
  ["unbeholden.dev", ["spaceship-dns", "own-mail", "smtp2go", "own-hosting"], 50],
])("captured %s scores only %p, at %d", async (domain, ids, score) => {
  const result = await scanDomain(domain, fake(await Bun.file(`${import.meta.dir}/fixtures/${domain}.json`).json()));
  expect(result.detections.filter((d) => d.kind !== "unscored").map((d) => d.id)).toEqual(ids);
  expect(result.score).toBe(score);
});

const dns = (records: Record<string, string[]>) => fake({ dns: records, http: page });

test("Route 53 nameservers are rented DNS with their records as evidence", async () => {
  const result = await scanDomain("example.com", dns({ "NS example.com": ["ns-1.awsdns-01.org", "ns-2.awsdns-02.com"] }));
  expect(result.detections).toEqual([
    {
      id: "route-53",
      name: "Amazon Route 53",
      category: "dns",
      company: "Amazon",
      kind: "rented",
      weight: 3,
      evidence: [
        { source: "dns", detail: "NS ns-1.awsdns-01.org" },
        { source: "dns", detail: "NS ns-2.awsdns-02.com" },
      ],
      alternatives: expect.arrayContaining([expect.objectContaining({ name: "PowerDNS" })]),
    },
  ]);
});

test.each([
  ["ada.ns.cloudflare.com", "cloudflare-dns"],
  ["ns-1234.awsdns-56.org", "route-53"],
  ["ns-cloud-a1.googledomains.com", "google-cloud-dns"],
  ["ns1-04.azure-dns.com", "azure-dns"],
  ["ns05.domaincontrol.com", "godaddy-dns"],
  ["dns1.registrar-servers.com", "namecheap-dns"],
  ["ns-123-a.gandi.net", "gandi-dns"],
  ["dns200.anycast.me", "ovh-dns"],
  ["hydrogen.ns.hetzner.com", "hetzner-dns"],
  ["ns1.digitalocean.com", "digitalocean-dns"],
  ["curitiba.ns.porkbun.com", "porkbun-dns"],
  ["a1-64.akam.net", "akamai-dns"],
  ["ns1.exoscale.ch", "exoscale-dns"],
  ["ns1.cscdns.net", "csc-dns"],
  ["pns41.cloudns.net", "cloudns"],
])("NS %s is %s", async (host, id) => {
  const [detection] = (await scanDomain("example.com", dns({ "NS example.com": [host] }))).detections;
  expect(detection).toMatchObject({ id, kind: "rented", category: "dns", weight: 3 });
});

test("nameservers under the scanned domain are owned DNS", async () => {
  const [detection] = (await scanDomain("example.com", dns({ "NS example.com": ["ns1.example.com"] }))).detections;
  expect(detection).toMatchObject({ kind: "owned", category: "dns", evidence: [{ source: "dns", detail: "NS ns1.example.com" }] });
});

test("unmatched nameservers are other third party with the raw record", async () => {
  const [detection] = (await scanDomain("example.com", dns({ "NS example.com": ["ns1.dnshost.net."] }))).detections;
  expect(detection).toMatchObject({
    name: "Other third party",
    category: "dns",
    company: "dnshost.net",
    kind: "rented",
    evidence: [{ source: "dns", detail: "NS ns1.dnshost.net." }],
  });
});

const spf = (record: string) => dns({ "TXT example.com": [record] });

test("an SPF include is a sending service with the include as evidence", async () => {
  const result = await scanDomain("example.com", spf("v=spf1 include:sendgrid.net ~all"));
  expect(result.detections).toEqual([
    {
      id: "sendgrid",
      name: "SendGrid",
      category: "mail",
      company: "Twilio",
      kind: "rented",
      weight: 3,
      evidence: [{ source: "dns", detail: "SPF include:sendgrid.net" }],
      alternatives: expect.arrayContaining([expect.objectContaining({ name: "Postal" })]),
    },
  ]);
});

test.each([
  ["_spf.google.com", "google-workspace"],
  ["spf.protection.outlook.com", "microsoft-365"],
  ["servers.mcsv.net", "mailchimp"],
  ["spf.mandrillapp.com", "mandrill"],
  ["amazonses.com", "amazon-ses"],
  ["spf.mtasv.net", "postmark"],
  ["1234567.spf01.hubspotemail.net", "hubspot"],
  ["mailgun.org", "mailgun"],
  ["spf.brevo.com", "brevo"],
  ["spf.mailjet.com", "mailjet"],
  ["mail.zendesk.com", "zendesk"],
  ["_spf.salesforce.com", "salesforce"],
  ["_spf.protonmail.ch", "proton"],
  ["spf.messagingengine.com", "fastmail"],
  ["_spf.mx.cloudflare.net", "cloudflare-email-routing"],
  ["helpscoutemail.com", "help-scout"],
  ["spf-00123.pphosted.com", "proofpoint"],
  ["eu._netblocks.mimecast.com", "mimecast"],
  ["sparkpostmail.com", "sparkpost"],
  ["_spf.createsend.com", "campaign-monitor"],
])("SPF include:%s is %s", async (host, id) => {
  const [detection] = (await scanDomain("example.com", spf(`v=spf1 include:${host} -all`))).detections;
  expect(detection).toMatchObject({ id, kind: "rented", category: "mail" });
});

test("SPF and MX for the same provider are one detection with both records", async () => {
  const adapters = dns({ "MX example.com": ["1 smtp.google.com"], "TXT example.com": ["v=spf1 include:_spf.google.com ~all"] });
  const result = await scanDomain("example.com", adapters);
  expect(result.detections).toMatchObject([
    {
      id: "google-workspace",
      evidence: [
        { source: "dns", detail: "MX 1 smtp.google.com" },
        { source: "dns", detail: "SPF include:_spf.google.com" },
      ],
    },
  ]);
});

test("an SPF include with macros is skipped", async () => {
  const result = await scanDomain("example.com", spf("v=spf1 include:%{i}._ip.%{h}._ehlo.%{d}._spf.vali.email ~all"));
  expect(result.detections).toEqual([]);
});

test("a catalogue entry matches a rule id regardless of case", async () => {
  const [detection] = (await scanDomain("example.com", spf("v=spf1 include:mail.zendesk.com ~all"))).detections;
  expect(detection.alternatives.map((a) => a.name)).toEqual(["Chatwoot", "Zammad"]);
});

test("Microsoft 365 DKIM under mail.microsoft is Microsoft 365", async () => {
  const target = "selector1-example-com._domainkey.example.a-v1.dkim.mail.microsoft";
  const [detection] = (await scanDomain("example.com", dns({ "CNAME selector1._domainkey.example.com": [target] }))).detections;
  expect(detection).toMatchObject({ id: "microsoft-365", kind: "rented" });
});

test("a category's weight is shared by its providers", async () => {
  const result = await scanDomain("example.com", dns({
    "NS example.com": ["ns1.example.com"],
    "TXT example.com": ["v=spf1 include:sendgrid.net include:mailgun.org include:amazonses.com ~all"],
  }));
  expect(result.score).toBe(50);
});

test("SPF redirect counts like an include", async () => {
  const [detection] = (await scanDomain("example.com", spf("v=spf1 redirect=_spf.google.com"))).detections;
  expect(detection).toMatchObject({ id: "google-workspace", evidence: [{ source: "dns", detail: "SPF redirect=_spf.google.com" }] });
});

test("an unmatched SPF include is other third party", async () => {
  const [detection] = (await scanDomain("example.com", spf("v=spf1 include:_spf.esp.example.net ~all"))).detections;
  expect(detection).toMatchObject({ name: "Other third party", company: "example.net", kind: "rented", category: "mail" });
});

test("SPF includes under the scanned domain, and other TXT records, are not detections", async () => {
  const adapters = dns({ "TXT example.com": ["v=spf1 include:_spf.example.com ip4:192.0.2.1 ~all", "some random token"] });
  expect((await scanDomain("example.com", adapters)).detections).toEqual([]);
});

test("a DKIM selector pointing at a provider is that provider with the record as evidence", async () => {
  const name = "s1._domainkey.example.com";
  const target = "s1.domainkey.u123.wl.sendgrid.net";
  const result = await scanDomain("example.com", dns({ [`CNAME ${name}`]: [target] }));
  expect(result.detections).toEqual([
    {
      id: "sendgrid",
      name: "SendGrid",
      category: "mail",
      company: "Twilio",
      kind: "rented",
      weight: 3,
      evidence: [{ source: "dns", detail: `CNAME ${name} ${target}` }],
      alternatives: expect.arrayContaining([expect.objectContaining({ name: "Postal" })]),
    },
  ]);
});

test.each([
  ["selector1", "selector1-example-com._domainkey.example.onmicrosoft.com", "microsoft-365"],
  ["k1", "dkim.mcsv.net", "mailchimp"],
  ["fm1", "fm1.example.com.dkim.fmhosted.com", "fastmail"],
  ["protonmail", "protonmail.domainkey.abc.domains.proton.ch", "proton"],
])("DKIM %s CNAME %s is %s", async (selector, target, id) => {
  const adapters = dns({ [`CNAME ${selector}._domainkey.example.com`]: [target] });
  expect((await scanDomain("example.com", adapters)).detections).toMatchObject([{ id, kind: "rented", category: "mail" }]);
});

test.each([
  ["google", "google-workspace"],
  ["mandrill", "mandrill"],
])("a DKIM key at selector %s is %s", async (selector, id) => {
  const name = `${selector}._domainkey.example.com`;
  const adapters = dns({ [`TXT ${name}`]: ["v=DKIM1; k=rsa; p=MIGf"] });
  expect((await scanDomain("example.com", adapters)).detections).toMatchObject([
    { id, evidence: [{ source: "dns", detail: `TXT ${name} v=DKIM1; k=rsa; p=MIGf` }] },
  ]);
});

test("a DKIM key at a shared selector is not guessed", async () => {
  const adapters = dns({ "TXT k1._domainkey.example.com": ["v=DKIM1; k=rsa; p=MIGf"] });
  expect((await scanDomain("example.com", adapters)).detections).toEqual([]);
});

test("a DKIM CNAME to an unknown host is other third party", async () => {
  const adapters = dns({ "CNAME s1._domainkey.example.com": ["s1.dkim.esp.example.net"] });
  expect((await scanDomain("example.com", adapters)).detections).toMatchObject([
    { name: "Other third party", company: "example.net", category: "mail" },
  ]);
});

test("a verification record is an unscored account with the record as evidence", async () => {
  const result = await scanDomain("example.com", dns({ "TXT example.com": ["google-site-verification=abc123"] }));
  expect(result.detections).toEqual([
    {
      id: "google-account",
      name: "Google",
      category: "account",
      company: "Google",
      kind: "unscored",
      weight: 0,
      evidence: [{ source: "dns", detail: "TXT google-site-verification=abc123" }],
      alternatives: [],
    },
  ]);
  expect(result.score).toBeNull();
  expect(result.rentedCompanies).toEqual([]);
});

test.each([
  ["MS=ms12345678", "microsoft-account"],
  ["apple-domain-verification=abc", "apple-account"],
  ["facebook-domain-verification=abc", "meta-account"],
  ["atlassian-domain-verification=abc", "atlassian-account"],
  ["docusign=abc", "docusign-account"],
  ["stripe-verification=abc", "stripe-account"],
  ["adobe-idp-site-verification=abc", "adobe-account"],
  ["openai-domain-verification=dv-abc", "openai-account"],
  ["dropbox-domain-verification=abc", "dropbox-account"],
  ["ZOOM_verify_abc", "zoom-account"],
])("TXT %s is %s", async (record, id) => {
  const result = await scanDomain("example.com", dns({ "TXT example.com": [record] }));
  expect(result.detections).toMatchObject([{ id, kind: "unscored", category: "account" }]);
});

test("a verification record does not change the score", async () => {
  const adapters = dns({ "MX example.com": ["10 mail.example.com"], "TXT example.com": ["google-site-verification=abc"] });
  expect((await scanDomain("example.com", adapters)).score).toBe(100);
});

test("a DKIM key at the mandrill selector is Mandrill", async () => {
  const adapters = dns({ "TXT mandrill._domainkey.example.com": ["v=DKIM1; p=MIGf"] });
  expect((await scanDomain("example.com", adapters)).detections).toEqual([
    {
      id: "mandrill",
      name: "Mandrill",
      category: "mail",
      company: "Intuit",
      kind: "rented",
      weight: 3,
      evidence: [{ source: "dns", detail: "TXT mandrill._domainkey.example.com v=DKIM1; p=MIGf" }],
      alternatives: expect.arrayContaining([expect.objectContaining({ name: "Postal" })]),
    },
  ]);
});

test("captured fastmail.com owns its Fastmail mail rather than renting it", async () => {
  const result = await scanDomain("fastmail.com", fake(await Bun.file(`${import.meta.dir}/fixtures/fastmail.com.json`).json()));
  expect(result.detections[0]).toMatchObject({ id: "fastmail", kind: "owned", alternatives: [] });
  expect(result.rentedCompanies).toEqual([]);
});

test("owned mail gets no alternatives, uncatalogued rented mail gets the mail defaults; companies are counted once each", async () => {
  const result = await scanDomain(
    "example.com",
    mx("10 mail.example.com", "20 example-com.mail.protection.outlook.com", "30 mx1.mailhost.net", "40 mx2.mailhost.net"),
  );
  expect(result.detections.map((d) => [d.id, d.alternatives.length])).toEqual([
    ["own-mail", 0],
    ["microsoft-365", 3],
    ["other-mail:mailhost.net", 3],
  ]);
  expect(result.rentedCompanies).toEqual(["Microsoft", "mailhost.net"]);
});

const site = (body: string, headers: Record<string, string> = {}) =>
  fake({ dns: {}, http: { status: 200, url: "https://example.com/", headers, body } });

test("a CSP allowlist and a site verification tag are not detections", async () => {
  const result = await scanDomain(
    "example.com",
    site(`<html><head><meta name="naver-site-verification" content="0280b3893b4fa7c8"></head></html>`, {
      "content-security-policy": "default-src 'self' https://*.paypal.com",
    }),
  );
  expect(result.detections.map((d) => d.name)).not.toContain("PayPal");
  expect(result.detections.map((d) => d.name)).not.toContain("Naver Analytics");
});

test("a vendor's own product on its own site is owned", async () => {
  const result = await scanDomain("paypal.com", site(`<html><body><div data-paypal-smart-button-version="5"></div></body></html>`));
  expect(result.detections.find((d) => d.name === "PayPal")).toMatchObject({ kind: "owned" });
});

test("Google Analytics and Google Fonts are rented, with the tags as evidence", async () => {
  const result = await scanDomain(
    "example.com",
    site(`<html><head>
<link href="https://fonts.googleapis.com/css2?family=Inter" rel="stylesheet">
<script async src="https://www.googletagmanager.com/gtag/js?id=G-1234"></script>
</head><body></body></html>`),
  );
  expect(result.detections.map(({ alternatives, ...d }) => d)).toEqual([
    {
      id: "Google Font API",
      name: "Google Font API",
      category: "fonts",
      company: "Google",
      kind: "rented",
      weight: 1,
      evidence: [{ source: "html", detail: "https://fonts.googleapis.com/css2?family=Inter" }],
    },
    {
      id: "Google Tag Manager",
      name: "Google Tag Manager",
      category: "tag-managers",
      company: "Google",
      kind: "rented",
      weight: 1,
      evidence: [{ source: "html", detail: "https://www.googletagmanager.com/gtag/js?id=G-1234" }],
    },
    {
      id: "Google Analytics",
      name: "Google Analytics",
      category: "analytics",
      company: "Google",
      kind: "rented",
      weight: 1,
      evidence: [{ source: "html", detail: "https://www.googletagmanager.com/gtag/js?id=G-1234" }],
    },
  ]);
  expect(result.score).toBe(0);
  expect(result.rentedCompanies).toEqual(["Google"]);
});

test("libraries from a third-party CDN are unscored, and the CDN is rented even when open source", async () => {
  const result = await scanDomain(
    "example.com",
    site(`<html><head>
<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js"></script>
</head><body></body></html>`),
  );
  expect(result.detections.map(({ id, category, kind, weight }) => ({ id, category, kind, weight }))).toEqual([
    { id: "jQuery CDN", category: "cdn", kind: "rented", weight: 2 },
    { id: "jQuery", category: "JavaScript libraries", kind: "unscored", weight: 0 },
    { id: "cdnjs", category: "cdn", kind: "rented", weight: 2 },
  ]);
});

test("self-hosted Matomo is owned analytics", async () => {
  const result = await scanDomain(
    "example.com",
    site(`<html><head><script>
  var _paq = window._paq = window._paq || [];
  _paq.push(['trackPageView']);
  (function() { var u="//stats.example.com/"; _paq.push(['setTrackerUrl', u+'matomo.php']);
    var d=document, g=d.createElement('script'); g.async=true; g.src=u+'matomo.js'; })();
</script></head><body></body></html>`),
  );
  expect(result.detections).toMatchObject([
    { id: "Matomo Analytics", category: "analytics", kind: "owned", weight: 1, evidence: [{ source: "html", detail: "matomo.js" }] },
  ]);
  expect(result.score).toBe(100);
});

test("an unrecognised script from another host is listed as other third party, own hosts are not", async () => {
  const result = await scanDomain(
    "example.com",
    site(`<html><head>
<script src="https://widget.helpwidget.net/w.js"></script>
<script src="https://static.example.com/app.js"></script>
<script src="/app.js"></script>
</head><body></body></html>`),
  );
  expect(result.detections).toEqual([
    {
      id: "other:helpwidget.net",
      name: "Other third party",
      category: "other third party",
      company: "helpwidget.net",
      kind: "unscored",
      weight: 0,
      evidence: [{ source: "html", detail: "https://widget.helpwidget.net/w.js" }],
      alternatives: [],
    },
  ]);
});

test("a library from an unrecognised CDN host is a rented CDN item for that host", async () => {
  const result = await scanDomain(
    "example.com",
    site(`<html><head><script src="https://static.libhost.net/jquery-3.7.1.min.js"></script></head></html>`),
  );
  expect(result.detections).toEqual([
    expect.objectContaining({ id: "jQuery", kind: "unscored" }),
    {
      id: "cdn:libhost.net",
      name: "libhost.net",
      category: "cdn",
      company: "libhost.net",
      kind: "rented",
      weight: 2,
      evidence: [{ source: "html", detail: "https://static.libhost.net/jquery-3.7.1.min.js" }],
      alternatives: [],
    },
  ]);
});

test("a tool in several scored categories takes the heaviest", async () => {
  const result = await scanDomain("example.com", site(`<script src="https://static.intercomcdn.com/intercom.v1.js"></script>`));
  expect(result.detections).toMatchObject([{ id: "Intercom", category: "crm", kind: "rented", weight: 2 }]);
});

test("a recognised tool outside the scored categories, loaded from another host, is other third party", async () => {
  const result = await scanDomain("example.com", site(`<script src="https://consent.cookiebot.com/uc.js"></script>`));
  expect(result.detections).toMatchObject([
    { id: "Cookiebot", category: "other third party", kind: "unscored", evidence: [{ detail: "https://consent.cookiebot.com/uc.js" }] },
  ]);
});

const ga = `<script src="https://www.googletagmanager.com/gtag/js?id=G-1234"></script>`;
const redirect = (location: string) => new Response(null, { status: 301, headers: { location } });

function serve(pages: Record<string, Response>, dns: Record<string, string[]> = {}) {
  const httpCalls: string[] = [];
  return {
    httpCalls,
    asn: () => null,
    dns: { resolve: async (name: string, type: string) => dns[`${type} ${name}`] ?? [] },
    http: {
      get: async (url: string) => {
        httpCalls.push(url);
        return pages[url] ?? new Response("", { status: 404 });
      },
    },
  };
}

test("one redirect is followed and the target page is scanned", async () => {
  const adapters = serve({
    "https://example.com/": redirect("https://www.example.com/"),
    "https://www.example.com/": new Response(ga),
  }, { "A www.example.com": ["93.184.215.14"] });
  const result = await scanDomain("example.com", adapters);
  expect(adapters.httpCalls).toEqual(["https://example.com/", "https://www.example.com/"]);
  expect(result.detections.map((d) => d.id)).toContain("Google Analytics");
});

test("a second redirect is not followed", async () => {
  const adapters = serve({
    "https://example.com/": redirect("https://www.example.com/"),
    "https://www.example.com/": redirect("/home"),
  }, { "A www.example.com": ["93.184.215.14"] });
  const result = await scanDomain("example.com", adapters);
  expect(adapters.httpCalls).toEqual(["https://example.com/", "https://www.example.com/"]);
  expect(result.status).toBe("ok");
});

test("a redirect to a private address is refused without fetching it", async () => {
  const adapters = serve({ "https://example.com/": redirect("https://intranet.example.org/") }, { "A intranet.example.org": ["10.0.0.5"] });
  const result = await scanDomain("example.com", adapters);
  expect(result.status).toBe("refused");
  expect(adapters.httpCalls).toEqual(["https://example.com/"]);
});

for (const target of ["http://127.0.0.1/", "http://169.254.169.254/latest/meta-data/", "http://[::1]/", "http://localhost/"])
  test(`a redirect to ${target} is refused without fetching it`, async () => {
    const adapters = serve({ "https://example.com/": redirect(target) });
    const result = await scanDomain("example.com", adapters);
    expect(result.status).toBe("refused");
    expect(adapters.httpCalls).toEqual(["https://example.com/"]);
  });

test("the body is read up to 2 MB and the rest ignored", async () => {
  const fonts = `<link href="https://fonts.googleapis.com/css2?family=Inter" rel="stylesheet">`;
  const adapters = serve({ "https://example.com/": new Response(ga + " ".repeat(2 * 1024 * 1024) + fonts) });
  const result = await scanDomain("example.com", adapters);
  expect(result.status).toBe("ok");
  expect(result.detections.map((d) => d.id)).toEqual(["Google Tag Manager", "Google Analytics"]);
});

test("a fetch that takes over 10 seconds is unreachable", async () => {
  jest.useFakeTimers();
  try {
    const result = await scanDomain("example.com", {
      asn: () => null,
      dns: { resolve: async () => [] },
      http: {
        get: (_url: string, signal: AbortSignal) => {
          const hang = new Promise<Response>((_, reject) => signal.addEventListener("abort", () => reject(signal.reason)));
          jest.advanceTimersByTime(10_000);
          return hang;
        },
      },
    });
    expect(result.status).toBe("unreachable");
  } finally {
    jest.useRealTimers();
  }
});

const captured = async (domain: string) =>
  scanDomain(domain, fake(await Bun.file(`${import.meta.dir}/fixtures/${domain}.json`).json()));
const hosting = (result: ScanResult) =>
  result.detections.filter((d) => d.category === "hosting").map(({ alternatives, ...d }) => d);

test("a Vercel site is rented hosting, named by its header, with the network as context", async () => {
  const result = await captured("nextjs.org");
  expect(hosting(result)).toEqual([
    {
      id: "Vercel",
      name: "Vercel",
      category: "hosting",
      company: "Vercel",
      kind: "rented",
      weight: 3,
      evidence: [
        { source: "header", detail: "x-vercel-id: fra1::sfo1::2rsm4-1791620675880-f802cef276fc" },
        { source: "asn", detail: "155.121.2.3 AS16509 AMAZON-02" },
      ],
    },
  ]);
  expect(result.detections.filter((d) => d.id === "Vercel")).toHaveLength(1);
});

test("an S3 site behind CloudFront is rented S3 hosting, and CloudFront stays a rented CDN", async () => {
  const result = await captured("karpenter.sh");
  expect(hosting(result)).toEqual([
    {
      id: "Amazon S3",
      name: "Amazon S3",
      category: "hosting",
      company: "Amazon",
      kind: "rented",
      weight: 3,
      evidence: [
        { source: "header", detail: "server: AmazonS3" },
        { source: "asn", detail: "65.9.130.36 AS16509 AMAZON-02" },
      ],
    },
  ]);
  expect(result.detections.find((d) => d.id === "Amazon CloudFront")).toMatchObject({ category: "cdn", kind: "rented", weight: 2 });
});

test("a plain VPS is owned hosting, with its network named", async () => {
  const result = await captured("unbeholden.dev");
  expect(hosting(result)).toEqual([
    {
      id: "own-hosting",
      name: "Own server",
      category: "hosting",
      company: "NETCUP-AS netcup GmbH",
      kind: "owned",
      weight: 3,
      evidence: [{ source: "asn", detail: "89.58.40.247 AS197540 NETCUP-AS netcup GmbH" }],
    },
  ]);
});

test("a site behind Cloudflare is a rented CDN, with hosting unknown and not scored", async () => {
  const result = await captured("signal.org");
  expect(hosting(result)).toEqual([
    {
      id: "unknown-hosting",
      name: "Unknown behind CDN",
      category: "hosting",
      company: "CLOUDFLARENET",
      kind: "unscored",
      weight: 0,
      evidence: [{ source: "asn", detail: "104.18.10.47 AS13335 CLOUDFLARENET" }],
    },
  ]);
  expect(result.detections.find((d) => d.id === "Cloudflare")).toMatchObject({ category: "cdn", kind: "rented", weight: 2 });
});

test("a missing ASN database leaves the hosting network unknown instead of failing the scan", async () => {
  process.env.ASN_DB = "/nonexistent/asn.sqlite";
  const result = await scanDomain("example.com", { ...fake({ dns: { "A example.com": ["93.184.215.14"] }, http: page }), asn: realAsn });
  expect(hosting(result)).toMatchObject([{ id: "own-hosting", company: undefined, evidence: [{ source: "asn", detail: "93.184.215.14" }] }]);
});

test("a Shopify store is rented Shopify hosting, not its own server", async () => {
  const result = await scanDomain("example.com", {
    ...site(`<script src="https://cdn.shopify.com/s/trekkie.storefront.js"></script>`),
    dns: { resolve: async (_: string, type: string) => (type === "A" ? ["93.184.215.14"] : []) },
  });
  expect(hosting(result)).toMatchObject([{ id: "Shopify", company: "Shopify", kind: "rented", weight: 3 }]);
  expect(result.detections.filter((d) => d.id === "Shopify")).toHaveLength(1);
});

test("an address on a CDN network is unknown hosting, not an own server", async () => {
  const result = await scanDomain("example.com", {
    ...fake({ dns: { "A example.com": ["151.101.1.91"] }, http: page }),
    asn: () => ({ asn: 54113, org: "FASTLY" }),
  });
  expect(hosting(result)).toMatchObject([{ id: "unknown-hosting", kind: "unscored" }]);
});

test("a CMS is scored: WordPress is owned", async () => {
  const result = await scanDomain("example.com", site(`<script src="/wp-includes/js/wp-embed.min.js"></script>`));
  expect(result.detections.find((d) => d.id === "WordPress")).toMatchObject({ category: "cms", kind: "owned", weight: 2 });
});

test("the Google Tag Manager noscript frame is Google Tag Manager", async () => {
  const result = await scanDomain("example.com", site(`<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-ABC"></iframe></noscript>`));
  expect(result.detections.map((d) => d.id)).toEqual(["Google Tag Manager"]);
});

test("the current Plausible script is Plausible", async () => {
  const result = await scanDomain("example.com", site(`<script defer src="https://plausible.io/js/script.js"></script>`));
  expect(result.detections).toMatchObject([{ id: "Plausible", category: "analytics" }]);
});

test("an error page is not read as the homepage", async () => {
  const result = await scanDomain("example.com", fake({ dns: {}, http: { ...page, status: 403, body: ga } }));
  expect(result.status).toBe("unreachable");
  expect(result.detections).toEqual([]);
});
