import { catalogue, type Repo } from "../src/scanner/catalogue";

type Fetch = (url: string) => Promise<Response>;

export async function refresh(repos: { repo: string; licence?: string }[], get: Fetch, now = new Date()) {
  const json = async (url: string) => {
    const res = await get(url);
    // GitHub 404s releases/latest when a repo has no full release; it falls back to tags.
    if (res.status === 404 && url.endsWith("/releases/latest")) return null;
    if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
    return res.json();
  };
  const { licenses } = await json("https://spdx.org/licenses/licenses.json");
  const osi = new Set(licenses.filter((l: any) => l.isOsiApproved).map((l: any) => l.licenseId));
  const since = new Date(now);
  since.setUTCFullYear(since.getUTCFullYear() - 1);
  const data: Record<string, Repo> = {};
  const failures: string[] = [];
  for (const { repo, licence } of repos) {
    const api = repo.replace("https://github.com/", "https://api.github.com/repos/");
    const info = await json(api);
    const spdxId = info.license?.spdx_id;
    const latest = await json(`${api}/releases/latest`);
    const [tag] = latest ? [] : await json(`${api}/tags?per_page=1`);
    const released = latest ? latest.published_at ?? latest.created_at : tag && (await json(tag.commit.url)).commit.committer.date;
    const entry = {
      licence: spdxId && spdxId !== "NOASSERTION" ? spdxId : licence ?? spdxId ?? "none",
      stars: info.stargazers_count,
      release: released?.slice(0, 10) ?? null,
      archived: info.archived,
    };
    data[repo] = entry;
    if (!osi.has(entry.licence)) failures.push(`${repo}: licence ${entry.licence} is not OSI-approved`);
    if (!entry.release || new Date(entry.release) < since) failures.push(`${repo}: no release since ${since.toISOString().slice(0, 10)}`);
    if (entry.archived) failures.push(`${repo}: archived`);
  }
  return { data, failures };
}

if (import.meta.main) {
  const token = process.env.GITHUB_TOKEN;
  const auth = (url: string) => (token && url.startsWith("https://api.github.com/") ? { authorization: `Bearer ${token}` } : undefined);
  const repos = [...new Map(catalogue.flatMap((t) => t.alternatives).map((a) => [a.repo, { repo: a.repo, licence: a.licence }])).values()].sort((a, b) => a.repo.localeCompare(b.repo));
  const { data, failures } = await refresh(repos, (url) => fetch(url, { headers: auth(url) }));
  await Bun.write("src/github.json", JSON.stringify(data, null, 2) + "\n");
  for (const failure of failures) console.error(failure);
  if (failures.length) process.exit(1);
}
