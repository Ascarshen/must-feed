# Must-Feed

This repository runs a GitHub Actions based dinner reminder. Agents working in
this repo should keep changes small, traceable, and biased toward preserving the
daily reminder history. The remote workflow design is the source of truth; old
local-only designs can be discarded.

## Project Shape

- `.github/workflows/dinner-reminder.yml` contains the scheduled workflow and
  most application logic.
- `data/dinner-state.json` is persisted state written by the workflow. Treat it
  as production data, not as a scratch file.
- The workflow targets the stable GitHub issue configured by `ISSUE_NUMBER`.
  Do not switch back to title-based issue discovery unless explicitly requested.
- The target local time zone is `Europe/Copenhagen`; date logic should be
  evaluated in that time zone unless the code clearly says otherwise.

## Working Rules

- Read the current workflow before editing behavior. The script is intentionally
  self-contained inside `actions/github-script`.
- Preserve existing state fields when updating `data/dinner-state.json`.
  Additive schema changes are preferred over destructive rewrites.
- Do not manually edit historical dinner records unless the task is explicitly
  about correcting history.
- Keep user-facing reminder tone playful, lightly sarcastic, and caring. Avoid
  guilt, pressure, insults, or anything that sounds disappointed.
- Keep secrets out of the repo. `OPENAI_API_KEY` must remain a GitHub secret.
- Avoid broad refactors. This repo is small, so clarity beats abstraction.

## Change Process

1. Check `git status --short --branch` before changing files.
2. Identify whether the change affects workflow behavior, persisted state, or
   documentation only.
3. For workflow changes, inspect the relevant script section and keep edits
   close to the existing style.
4. For state changes, explain why the historical record is being changed.
5. After edits, run a syntax-oriented check when possible:
   - For YAML structure: inspect `.github/workflows/dinner-reminder.yml`.
   - For JSON data: run `jq . data/dinner-state.json` when `jq` is available.
6. Re-check `git status --short --branch` and summarize changed files.

## Behavior Log

Use this section to record project-level behavior decisions that future agents
should respect. Keep entries short and factual.

- 2026-04-29: The workflow uses a fixed `ISSUE_NUMBER` and repository-backed
  `STATE_FILE` (`data/dinner-state.json`) as the source of persisted dinner
  state.
- 2026-04-29: Scheduled runs may trigger multiple times per UTC day, but the
  workflow should post at most once per Denmark local date.
