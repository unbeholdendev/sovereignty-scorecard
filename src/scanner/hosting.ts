import type { Asn } from "./asn";
import type { Detection } from "./scan";
import { detection } from "./weights";

const platforms = [
  { id: "Amazon S3", company: "Amazon", header: "server", value: /^AmazonS3$/ },
  { id: "Vercel", company: "Vercel", header: "x-vercel-id" },
  { id: "Netlify", company: "Netlify", header: "x-nf-request-id" },
  { id: "GitHub Pages", company: "GitHub", header: "x-github-request-id" },
  { id: "Firebase Hosting", company: "Google", header: "vary", value: /x-fh-requested-host/i },
  { id: "Azure App Service", company: "Microsoft", header: "set-cookie", value: /ARRAffinity=/ },
  { id: "Cloudflare Workers", company: "Cloudflare", header: "cf-placement" },
  { id: "Amazon CloudFront", company: "Amazon", header: "x-amz-cf-id" },
];

// Cloudflare, Fastly, Akamai, CDN77 and Google's front end: an address here is never the site's own server.
const cdnNetworks = new Set([13335, 209242, 54113, 20940, 16625, 21342, 60068, 15169]);

export function detectHosting(headers: Record<string, string>, ip: string, asn: Asn, homepage: Detection[]): Detection {
  const net = asn(ip);
  const network = { source: "asn" as const, detail: net ? `${ip} AS${net.asn} ${net.org}` : ip };
  const platform = platforms.find((p) => headers[p.header] !== undefined && (!p.value || p.value.test(headers[p.header])));
  if (platform)
    return detection({
      id: platform.id, name: platform.id, category: "hosting", company: platform.company, kind: "rented",
      evidence: [{ source: "header", detail: `${platform.header}: ${headers[platform.header]}` }, network],
    });
  const site = homepage.find((d) => d.category === "hosting");
  if (site) return { ...site, evidence: [...site.evidence, network] };
  const cdn = cdnNetworks.has(net?.asn!) || homepage.some((d) => d.category === "cdn" && d.evidence.some((e) => e.source === "header"));
  return detection({
    id: cdn ? "unknown-hosting" : "own-hosting", name: cdn ? "Unknown behind CDN" : "Own server", category: "hosting",
    company: net?.org, kind: cdn ? "unscored" : "owned", evidence: [network],
  });
}
