---
version: 1
slug: "src-pages-domain-astro"
primary_target: "src/pages/[domain].astro"
related_targets: []
---

# Result page (/[domain])

Mode: Read. Visitor: any site owner, technical or not, often arriving from a shared link. Job: understand what the site rents, from whom, and what open source could replace it. Build path: code-led.

## Direction contract

THESIS: The result is a jackfield normalling schedule: every rented service is a numbered lane whose link to its open source "normal" is broken. Refuses the scanner-report grade tile, KPI cards and red/green pass-fail.

OWN-WORLD: Light ground #FAFAF8, ink #17181B, hairline lane rules. Two signal colours with one meaning each: magenta #C2307F = rented (and the broken half of the link), deep cyan #0A85A8 = open source (alternatives and the intact half). Barlow Condensed for lane numbers and the headline only, Archivo for everything else, JetBrains Mono only for evidence. No glow, no fills, no cards.

STORY: The visitor reads one sentence ("linear.app rents 9 services from 6 companies."), sees the score, scans one line per rented service with its alternatives named, and opens Details only when they want evidence, licence, stars and release.

FIRST VIEWPORT: Slim top bar (name, scan date, domain search). Headline at 46px condensed left, score "0 / 100 owned" right, one counts line. One key line with a link glyph. Then all rented lanes as 51px single-line rows: number, service, "rented from Company", 90px broken link, cyan alternative names, Details toggle. Lane 01 open by default is not required. Scan note as a footnote.

FORM: Jackfield normalling schedule (catalog challenger, chosen in round 5, refined light and distilled in round 7, variant L1 "Quiet Lanes"). Seed key 6f82d9ff.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Constraints
- No third-party requests: fonts self-hosted.
- States: refused, unreachable, not enough data (score null), owned lanes (unbroken cyan link), lanes with no alternative (dashed grey right half), not-scored list collapsed.
- Rescan, email capture with consent text, removal contact stay.
