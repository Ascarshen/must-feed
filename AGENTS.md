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

## Local Reminder Dry Run

Use this when tuning the reminder voice or prompt. The goal is to test the
generated reminder text without posting to GitHub and without writing
`data/dinner-state.json`.

- Read the API key from the local untracked `secret` file. Never print the key
  or commit the file.
- Do not run the full scheduled workflow for copy tests. Instead, run a local
  Node script that extracts the current `buildAiReminder` function from
  `.github/workflows/dinner-reminder.yml`, mocks `core`, sets
  `OPENAI_BASE_URL=https://api.ikuncode.cc` and `OPENAI_MODEL=gpt-5.5`, and
  calls `buildAiReminder` with representative `confirmationSummary`,
  `dinnerState`, and `recentComments`.
- Run the script as a PowerShell here-string piped to Node:
  `@' ...dry-run JS... '@ | node --input-type=module -`
- The dry-run should print only the generated reminder and its character
  length. It must not call GitHub issue APIs or repository content write APIs.
- For image prompt tests, write local outputs under `image-dry-runs/` and use
  `assets/dinner-duty-bot-reference.jpg` only as the bot identity/style
  reference. Do not post test images to GitHub.
- Production reminder images are saved by the workflow under
  `generated/dinner-duty-bot/` and embedded in the same issue comment as the
  daily text reminder. The workflow posts the text first, then generates the
  image with streaming Responses image generation and updates the same comment
  if the image succeeds. Image generation can use `OPENAI_IMAGE_BASE_URL` and
  `OPENAI_IMAGE_MODEL` separately from the text reminder settings.
- For manual Actions tests, use `workflow_dispatch` inputs instead of changing
  production env defaults. Point test runs at a separate issue, state file, and
  image output directory. Repository content reads and writes should explicitly
  use the workflow's current branch so branch tests do not write to `main`.
- The temporary `codex/image-generation-action-test` branch may use a branch-only
  push trigger that targets issue #8 and `@Ascarshen`; remove that test trigger
  before merging the workflow back to `main`.
- For workflow syntax checks, extract the embedded `script: |` body, wrap it in
  `async function __github_script__() { ... }`, and pipe it to `node --check -`.

## Behavior Log

Use this section to record project-level behavior decisions that future agents
should respect. Keep entries short and factual.

- 2026-04-29: The workflow uses a fixed `ISSUE_NUMBER` and repository-backed
  `STATE_FILE` (`data/dinner-state.json`) as the source of persisted dinner
  state.
- 2026-04-29: Scheduled runs may trigger multiple times per UTC day, but the
  workflow should post at most once per Denmark local date.
- 2026-05-08: Reminder images are generated in a second API call after the text
  reminder. If image generation or image saving fails, the workflow should still
  post the text reminder and update dinner state.
- 2026-05-09: Image generation uses streaming Responses image generation. The
  workflow posts text and state first, then appends the image to the same
  comment when image generation succeeds.
- 2026-05-09: Manual workflow dispatch supports overriding the issue number,
  target username, target display name, state file, and image output directory
  for isolated image-generation tests.
- 2026-05-09: The `codex/image-generation-action-test` branch is allowed to run
  isolated push-triggered image tests against issue #8.
