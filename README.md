# Unbeholden Check

Type in a domain and see how much of the site is rented from third parties, and
which open source software could replace each rented piece.

Live at https://check.unbeholden.dev. This is a mirror of my self-hosted repo.

## What a scan shows

- An ownership score from 0 to 100: the weighted share of detected services
  that run on open source software.
- Every detected third party, marked owned, rented or not scored, with the DNS
  record, header or HTML snippet it was detected from.
- For each rented tool, up to three open source alternatives, each with a
  self-host and a managed option, its licence, GitHub stars and latest release.

Mail, DNS and hosting weigh 3; CDN, auth, payments, forms, CRM and CMS weigh 2;
everything else weighs 1. Providers in one category share its weight. Libraries
are listed but not scored. When nothing scorable is found, the page says "not
enough data" instead of showing a score.

Detection is passive: DNS lookups and one plain fetch of the homepage. Tools
that load later through JavaScript can be missed, and the result page says so.
Alternatives must have an OSI licence, a release in the last 12 months, and an
unarchived repo.

The site loads no third-party scripts, fonts or assets.

## Run it

You need [Bun](https://bun.sh).

```sh
bun install
bun run asn    # downloads iptoasn.com data into asn.sqlite
bun run dev
bun test
```

The server listens on port 38572. The Dockerfile builds the same thing into an
image, with the database at `/data/scorecard.db`.

| Variable | |
|---|---|
| `SITE` | public URL, default `https://check.unbeholden.dev` |
| `DATABASE_PATH` | SQLite file for results, share cards and signups, default `scorecard.db` |
| `ASN_DB` | where `bun run asn` writes, default `asn.sqlite` |
| `NTFY_URL`, `NTFY_TOPIC`, `NTFY_TOKEN` | optional ntfy notification for each email signup |
| `UMAMI_URL`, `UMAMI_WEBSITE_ID` | optional self-hosted Umami, proxied through the site at `/u/` |
| `GITHUB_TOKEN` | optional, raises the rate limit for `bun run refresh` |

## Data

- `src/catalogue/`: one YAML file per detected tool, with its alternatives.
- `src/defaults.yaml`: default alternatives per category.
- `src/github.json`: stars and latest releases, refreshed with `bun run refresh`.
- `src/wappalyzer/`: technology fingerprints from
  [enthec/webappanalyzer](https://github.com/enthec/webappanalyzer), refreshed
  with `bun run wappalyzer`.

`bun run release` refreshes all of it and builds.

## Licence

AGPL-3.0. See `LICENSE`. The Wappalyzer fingerprints in `src/wappalyzer/` and
the `wappalyzer-core` package are GPL-3.0. Inter in `src/fonts/` is under the
SIL Open Font License.
