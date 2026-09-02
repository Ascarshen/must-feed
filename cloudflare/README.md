# Cloudflare Dinner Scheduler

This Worker triggers the existing GitHub Actions dinner reminder through
`workflow_dispatch`. It does not post GitHub comments itself.

The Worker wakes every five minutes during the two UTC hours that can correspond
to 18:00 in `Europe/Copenhagen`, then dispatches the workflow only when the
actual Copenhagen local time is `18:00-18:59`.

## Setup

Create a GitHub fine-grained token for `Ascarshen/must-feed` with:

- Actions: Read and write
- Metadata: Read

Store it as a Cloudflare Worker secret:

```bash
npx wrangler secret put GITHUB_TOKEN --config cloudflare/wrangler.toml
```

Optionally enable protected manual dispatches through the Worker URL:

```bash
npx wrangler secret put SCHEDULER_TOKEN --config cloudflare/wrangler.toml
```

Deploy:

```bash
npx wrangler deploy --config cloudflare/wrangler.toml
```

The GitHub workflow still has its own time-window guard, so delayed dispatches
outside the dinner hour are skipped.
