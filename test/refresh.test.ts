import { expect, test } from "bun:test";
import { refresh } from "../scripts/refresh";

const now = new Date("2026-10-10T00:00:00Z");
const spdx = { licenses: [{ licenseId: "MIT", isOsiApproved: true }, { licenseId: "BUSL-1.1", isOsiApproved: false }, { licenseId: "AGPL-3.0-only", isOsiApproved: true }] };

function github(repos: Record<string, { licence: string | null; archived?: boolean; release?: string; tag?: string }>) {
  return async (url: string) => {
    if (url === "https://spdx.org/licenses/licenses.json") return Response.json(spdx);
    const [, path, rest] = url.match(/^https:\/\/api\.github\.com\/repos\/([^/]+\/[^/]+)(.*)$/)!;
    const repo = repos[path];
    if (rest === "/tags?per_page=1") return Response.json(repo.tag ? [{ commit: { url: `https://api.github.com/repos/${path}/commits/abc` } }] : []);
    if (rest === "/commits/abc") return Response.json({ commit: { committer: { date: repo.tag } } });
    if (rest) return repo.release ? Response.json({ published_at: repo.release }) : new Response(null, { status: 404 });
    return Response.json({ license: repo.licence && { spdx_id: repo.licence }, stargazers_count: 1200, archived: repo.archived ?? false });
  };
}

test("an OSI-licensed, recently released, active repo passes with its licence, stars and release", async () => {
  const result = await refresh([{ repo: "https://github.com/a/ok" }], github({ "a/ok": { licence: "MIT", release: "2026-05-01T12:00:00Z" } }), now);
  expect(result).toEqual({
    data: { "https://github.com/a/ok": { licence: "MIT", stars: 1200, release: "2026-05-01", archived: false } },
    failures: [],
  });
});

test.each([
  ["a non-OSI licence", { licence: "BUSL-1.1", release: "2026-05-01T00:00:00Z" }, "licence BUSL-1.1 is not OSI-approved"],
  ["no licence GitHub recognises", { licence: "NOASSERTION", release: "2026-05-01T00:00:00Z" }, "licence NOASSERTION is not OSI-approved"],
  ["a release over 12 months old", { licence: "MIT", release: "2025-10-09T00:00:00Z" }, "no release since 2025-10-10"],
  ["no release or tag", { licence: "MIT" }, "no release since 2025-10-10"],
  ["only an old tag", { licence: "MIT", tag: "2025-01-01T00:00:00Z" }, "no release since 2025-10-10"],
  ["an archived repo", { licence: "MIT", release: "2026-05-01T00:00:00Z", archived: true }, "archived"],
])("%s fails the bar and names the repo", async (_, repo, reason) => {
  const result = await refresh([{ repo: "https://github.com/a/bad" }], github({ "a/bad": repo }), now);
  expect(result.failures).toEqual([`https://github.com/a/bad: ${reason}`]);
});

test.each([null, "NOASSERTION"])("a hand-set licence stands in when GitHub reports %p", async (spdxId) => {
  const result = await refresh(
    [{ repo: "https://github.com/a/dual", licence: "AGPL-3.0-only" }],
    github({ "a/dual": { licence: spdxId, release: "2026-05-01T00:00:00Z" } }),
    now,
  );
  expect(result.failures).toEqual([]);
  expect(result.data["https://github.com/a/dual"].licence).toBe("AGPL-3.0-only");
});

test("with no GitHub release, the newest tag's commit date counts as the release", async () => {
  const result = await refresh([{ repo: "https://github.com/a/tags" }], github({ "a/tags": { licence: "MIT", tag: "2026-03-01T09:00:00Z" } }), now);
  expect(result.failures).toEqual([]);
  expect(result.data["https://github.com/a/tags"].release).toBe("2026-03-01");
});
