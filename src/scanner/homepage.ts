import { Window } from "happy-dom";
import { getDomain } from "tldts";
import categories from "../wappalyzer/categories.json";
import technologies from "../wappalyzer/technologies.json";
import wappalyzer from "wappalyzer-core";
import { catalogue } from "./catalogue";
import type { Detection, Evidence, Page } from "./scan";
import { detection, weightOf } from "./weights";

wappalyzer.setTechnologies(technologies);
wappalyzer.setCategories(categories);

const scored: Record<number, string> = {
  10: "analytics", 78: "analytics", 42: "tag-managers", 17: "fonts", 31: "cdn", 52: "chat", 110: "forms", 73: "forms",
  16: "captcha", 14: "video", 103: "video", 35: "maps", 41: "payments", 91: "payments", 53: "crm", 32: "crm", 97: "crm",
  1: "cms", 11: "cms", 15: "comments", 29: "search", 69: "auth", 74: "ab-testing", 36: "ads", 77: "ads", 71: "ads",
};
const captcha = /captcha|turnstile/i;
const library = /^(JavaScript (libraries|frameworks)|UI frameworks)$/;

export async function detectHomepage(page: Page): Promise<Detection[]> {
  const window = new Window({
    url: page.url,
    settings: {
      disableJavaScriptEvaluation: true, disableJavaScriptFileLoading: true, disableCSSFileLoading: true,
      disableIframePageLoading: true, disableComputedStyleRendering: true,
    },
  });
  const doc = window.document;
  doc.documentElement.innerHTML = page.body;
  try {
    const meta: Record<string, string[]> = {};
    for (const m of doc.querySelectorAll("meta")) {
      const key = (m.getAttribute("name") ?? m.getAttribute("property"))?.toLowerCase();
      // Site verification tokens prove an account, not that the service runs on the page.
      if (key && !key.endsWith("-verification")) meta[key] = [m.getAttribute("content") ?? ""];
    }
    // A CSP lists what a page may load, not what it does.
    const headers = Object.fromEntries(Object.entries(page.headers).filter(([k]) => !k.startsWith("content-security-policy")).map(([k, v]) => [k, [v]]));
    const found = wappalyzer.analyze({
      url: page.url,
      html: page.body,
      meta,
      headers,
      scriptSrc: [...doc.querySelectorAll("script[src], iframe[src]")].map((s) => new URL(s.getAttribute("src")!, page.url).href),
      scripts: [...doc.querySelectorAll("script:not([src])")].map((s) => s.textContent).join("\n"),
    });
    const words = new Set(page.body.toLowerCase().match(/[\w-]+/g));
    for (const technology of wappalyzer.technologies)
      for (const [selector, [check]] of Object.entries<any>(technology.dom ?? {})) {
        if (!mayMatch(selector, words)) continue;
        let elements: any[];
        try { elements = [...doc.querySelectorAll(selector)]; } catch { continue; }
        if ("exists" in check && elements[0]) found.push({ technology, pattern: { type: "dom", value: elements[0].outerHTML.slice(0, 200) } });
        for (const el of elements) {
          for (const [attr, p] of Object.entries<any>(check.attributes ?? {})) {
            const value = el.getAttribute(attr);
            if (value != null && p.regex.test(value)) found.push({ technology, pattern: { type: "dom", value } });
          }
        }
      }

    const evidence: Record<string, Evidence[]> = {};
    for (const { technology, pattern } of found) {
      const header = pattern.type === "headers" || pattern.type === "cookies";
      const detail = pattern.type === "html" || pattern.type === "scripts" ? pattern.match : String(pattern.value);
      const list = (evidence[technology.name] ??= []);
      if (!list.some((e) => e.detail === detail)) list.push({ source: header ? "header" : "html", detail: detail.slice(0, 200) });
    }
    const detections = wappalyzer.resolve(found).filter((t: any) => evidence[t.name]).map((t: any) => {
      const category = categoryOf(t.name, t.categories.map((c: any) => c.id));
      const kind = !category ? "unscored" : category !== "cdn" && (technologies as Record<string, { oss?: boolean }>)[t.name]?.oss ? "owned" : "rented";
      return detection({ id: t.name, name: t.name, category: category ?? t.categories[0]?.name ?? "other", kind, evidence: evidence[t.name] });
    });
    const loaded = [...doc.querySelectorAll("script[src], link[rel~=stylesheet][href], iframe[src]")].map(
      (el) => new URL(el.getAttribute("src") ?? el.getAttribute("href")!, page.url).href,
    );
    return [...detections, ...otherThirdParties(detections, loaded, page.url)];
  } finally {
    await window.happyDOM.close();
  }
}

// Querying all 1,500 selectors takes seconds on a large page, so skip any that needs a tag, id, class, attribute or value word the HTML lacks.
function mayMatch(selector: string, words: Set<string>) {
  if (selector.includes("\\")) return true;
  return selector.toLowerCase().split(",").some((branch) => {
    const plain = branch.replace(/:[\w-]+(\([^)]*\))?/g, "");
    const bare = plain.replace(/\[\s*([\w-]+)[^\]]*\]/g, " [$1 ");
    const names = [...bare.matchAll(/(?:^|[\s>+~#.[])([a-z_][\w-]*)/g)].map((m) => m[1]);
    // A word at either end of a value may be part of a longer word in the page.
    const inner = [...plain.matchAll(/=\s*(['"])(.+?)\1/g)].flatMap(([, , v]) =>
      [...v.matchAll(/[\w-]+/g)].filter((m) => m.index > 0 && m.index + m[0].length < v.length).map((m) => m[0]));
    return [...names, ...inner].every((w) => words.has(w));
  });
}

function categoryOf(name: string, ids: number[]) {
  const listed = catalogue.find((c) => c.matches.includes(name))?.category;
  return [...(listed ? [listed] : []), ...ids
    // Wappalyzer's category 16 is all security tools; only captchas are a service.
    .filter((id) => scored[id] && (id !== 16 || captcha.test(name)))
    .map((id) => scored[id])]
    .sort((a, b) => weightOf(b) - weightOf(a))[0];
}

const hostOf = (url: string) => (URL.canParse(url) ? getDomain(url, { allowPrivateDomains: true }) : null);

function otherThirdParties(detections: Detection[], urls: string[], pageUrl: string) {
  const others = new Map<string, Detection>();
  for (const url of urls) {
    const host = hostOf(url);
    if (!host || host === hostOf(pageUrl)) continue;
    const users = detections.filter((d) => d.evidence.some((e) => hostOf(e.detail) === host));
    if (users.some((d) => d.kind !== "unscored")) continue;
    const cdn = users.some((d) => library.test(d.category));
    if (users.length && !cdn) {
      for (const d of users) d.category = "other third party";
      continue;
    }
    const other = others.get(host) ?? (cdn
      ? detection({ id: `cdn:${host}`, name: host, category: "cdn", company: host, kind: "rented", evidence: [] })
      : detection({ id: `other:${host}`, name: "Other third party", category: "other third party", company: host, kind: "unscored", evidence: [] }));
    other.evidence.push({ source: "html", detail: url });
    others.set(host, other);
  }
  return others.values();
}
