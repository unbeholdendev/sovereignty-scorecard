# Issue tracker: Forgejo

Issues live on git.home.unbeholden.dev, repo `unbeholden/sovereignty-scorecard`. Use `tea` from inside the repo, and `tea api <path>` for what it lacks.

## Conventions

- **Create**: `tea issues create --title <title> --description-file <file>`. Multi-line bodies are plain markdown.
- **Read**: `tea issues <index>`, plus `tea api repos/unbeholden/sovereignty-scorecard/issues/<index>/comments` for the thread.
- **List**: `tea issues list --state <state> --labels <names>`.
- **Comment**: `tea comment <index> <body>`.
- **Labels**: `tea issues edit <index> --add-labels <names>` / `--remove-labels <names>`. Create missing ones with `tea labels create --name <name> --color <hex>` first, never duplicate.
- **Close / reopen**: `tea issues close <index>` / `tea issues reopen <index>`, after a closing comment.

## Pull requests as a triage surface

**PRs as a request surface: no.** _(Set to `yes` if external PRs count as feature requests; `/triage` reads this flag.)_

When `yes`: `tea pr list`, `tea api repos/unbeholden/sovereignty-scorecard/pulls/<index>`, with `.diff` on that path for the diff, and the same label and comment commands. Issues and PRs share one number space.

## When a skill says "publish to the issue tracker"

Create a Forgejo issue.

## When a skill says "fetch the relevant ticket"

`tea issues <index>` plus `tea api` on its `comments`.

## Wayfinding operations

Used by `/wayfinder`. Forgejo has no sub-issues.

- **Map**: one issue labelled `wayfinder:map`, holding the Notes / Decisions-so-far / Fog body, with a task list of its children.
- **Child ticket**: an issue with `Part of #<map>` at the top of the body and a `wayfinder:<type>` label (`research`/`prototype`/`grilling`/`task`), added to the map's task list.
- **Blocking**: native dependencies, through `tea api` on `repos/unbeholden/sovereignty-scorecard/issues/<index>/dependencies`: `GET` to read, `POST` to add. A ticket is unblocked when every blocker is closed.
- **Frontier query**: open children from the map's task list, minus any with an open blocker or an assignee. First in map order wins.
- **Claim**: assign yourself with `tea issues edit <index> --add-assignees <username>`, as the session's first write.
- **Resolve**: `tea comment` with the answer, `tea issues close`, then append a gist and link to the map's Decisions-so-far.
