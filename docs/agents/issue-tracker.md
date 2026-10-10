# Issue tracker: Forgejo

Issues live on git.unbeholden.dev, repo `unbeholden/sovereignty-scorecard`. Use the Forgejo MCP tools (`mcp__forgejo__*`); no forge CLI is installed.

## Conventions

- **Create**: `create_issue` (title, body). Multi-line bodies are plain markdown.
- **Read**: `get_issue_by_index`, plus `list_issue_comments` for the thread.
- **List**: `list_repo_issues` with state and label filters.
- **Comment**: `create_issue_comment`.
- **Labels**: `add_issue_labels` / `remove_issue_labels`. Labels take ids; create missing ones with `create_repo_label` first, never duplicate.
- **Close / reopen**: `issue_state_change`, after a closing comment.

## Pull requests as a triage surface

**PRs as a request surface: no.** _(Set to `yes` if external PRs count as feature requests; `/triage` reads this flag.)_

When `yes`: `list_repo_pull_requests`, `get_pull_request_by_index`, `get_pull_request_diff`, and the same label and comment tools. Issues and PRs share one number space.

## When a skill says "publish to the issue tracker"

Create a Forgejo issue.

## When a skill says "fetch the relevant ticket"

`get_issue_by_index` plus `list_issue_comments`.

## Wayfinding operations

Used by `/wayfinder`. Forgejo has no sub-issues.

- **Map**: one issue labelled `wayfinder:map`, holding the Notes / Decisions-so-far / Fog body, with a task list of its children.
- **Child ticket**: an issue with `Part of #<map>` at the top of the body and a `wayfinder:<type>` label (`research`/`prototype`/`grilling`/`task`), added to the map's task list.
- **Blocking**: native dependencies, `add_issue_dependency` / `list_issue_dependencies`. A ticket is unblocked when every blocker is closed.
- **Frontier query**: open children from the map's task list, minus any with an open blocker or an assignee. First in map order wins.
- **Claim**: assign yourself with `update_issue`, as the session's first write.
- **Resolve**: `create_issue_comment` with the answer, `issue_state_change` to close, then append a gist and link to the map's Decisions-so-far.
