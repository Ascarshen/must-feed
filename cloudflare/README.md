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

The GitHub workflow no longer has its own hard time-window skip, because delayed
GitHub schedule runs were skipping the daily reminder. The Worker remains
responsible for dispatching only during the Copenhagen dinner hour.

## Manual Check

If `SCHEDULER_TOKEN` is configured, `/dispatch` can be called with:

```bash
curl -H "Authorization: Bearer $SCHEDULER_TOKEN" \
  https://must-feed-dinner-scheduler.ascarshen.workers.dev/dispatch
```

Outside the Copenhagen dinner hour this should return `dispatched: false`.
To verify the Worker can reach GitHub without posting a reminder, call:

```bash
curl -H "Authorization: Bearer $SCHEDULER_TOKEN" \
  "https://must-feed-dinner-scheduler.ascarshen.workers.dev/dispatch?force=1"
```

The Worker will trigger `workflow_dispatch`. Use this only for a controlled
connectivity check, because the workflow may post if today's reminder has not
already been posted.
