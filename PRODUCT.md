# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Anyone who runs a website, technical or not, equally. Developers and founders read the DNS records and evidence and may self-host. Small-business owners and marketers need the score to make sense without the evidence and will often want the managed option. A page must work for both: the evidence is there to verify, never required to get the point.

They arrive by typing their own domain, by following a shared result link or card, or by browsing examples and recent scans.

## Product Purpose

Unbeholden Check takes a domain and shows how much of the site is rented from third parties, and what open source software could replace each rented piece.

- An ownership score from 0 to 100: the weighted share of detected services that run on open source software.
- Every detected third party, marked owned, rented or not scored, with the exact evidence (DNS record, header or HTML snippet).
- For each rented tool, up to three hand-picked open source alternatives, each with self-host and managed options, licence, GitHub stars and latest release.

Success: a visitor gets a result in seconds without signing up, trusts it because they can check every finding, and leaves with a concrete next step.

## Positioning

Owned vs rented, not EU vs non-EU. Competing scanners (staysin.eu, meetergo, Lightwaves, CC*Scan) score jurisdiction and mostly serve as lead generation for one vendor. Check has no jurisdiction axis, sells nothing, and pairs every rented tool with vetted open source alternatives.

Check is a standalone, neutral tool. Unbeholden is credited and its articles are linked where they cover an alternative, but the publication is not front and centre.

Conservative detection with visible evidence is the main defence: a competitor was mocked on HN for false positives.

## Operating Context

- Landing: domain input, about six example results (including unbeholden.dev), recently scanned domains with scores.
- Result page per domain at `/<domain>`: public, indexable, stable URL. Cached 24 h; rescan once per domain per hour.
- Share card image per domain (`/<domain>/card.png`): score, "rented from N companies", top three rented tools with their first alternative.
- Email capture on result pages for future score-change alerts. Nothing is sent in v1.
- Removal by email request, handled by hand.

## Capabilities and Constraints

- Server-rendered HTML (Astro, Node adapter, Bun, SQLite) with no client framework.
- No third-party scripts, fonts, analytics or assets anywhere. The tool practises what it measures.
- Detection is passive: DNS plus one plain fetch of the homepage. The page must say plainly that tools loaded later by JavaScript may be missing.
- "Not enough data" instead of a score when nothing scorable is found. Never a false 100.
- Result states: ok, refused (private address), unreachable.
- Weights: mail, DNS, hosting 3; CDN, auth, payments, forms, CRM 2; everything else 1. Libraries are listed but not scored.
- Alternatives must be OSI-licensed, released within 12 months and not archived.
- Terms: ownership score, owned, rented, not scored, rented from N companies, alternative, self-host, managed.
- Out of scope: accounts, dashboards, badges, leaderboards, sending email, headless scanning, affiliate links, publishing the mapping as a dataset.

## Brand Commitments

- Name: Unbeholden Check.
- Voice: American English, plain and factual, no marketing tone.
- Inter (Regular, Bold) is bundled for the share card under `src/fonts/` (OFL).

## Evidence on Hand

- Real scan fixtures in `test/fixtures/` (fastmail.com, karpenter.sh, nextjs.org, signal.org, unbeholden.dev).
- Landing examples in `src/examples.json`, rescanned at build.
- Catalogue of 99 tools in `src/catalogue/`; GitHub metadata in `src/github.json`.
- unbeholden.dev currently scores 50 (Spaceship DNS and SMTP2GO count as rented).
- No testimonials, users, press or usage numbers exist. Do not invent them.
- `removal@unbeholden.dev` is a placeholder address.

## Product Principles

1. Show the evidence. Every claim on a result page can be checked by the visitor.
2. Never overclaim. Say what the scan cannot see; prefer "not enough data" to a flattering number.
3. A next step for every rented tool, with a managed path for people who won't run servers.
4. Neutral. No vendor, no jurisdiction axis, nothing for sale.
5. Practise what it measures: zero third-party requests.
