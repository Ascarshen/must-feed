const DEFAULT_OWNER = "Ascarshen";
const DEFAULT_REPO = "must-feed";
const DEFAULT_WORKFLOW_ID = "dinner-reminder.yml";
const DEFAULT_REF = "main";
const TARGET_TIME_ZONE = "Europe/Copenhagen";

export function getTargetTime(date) {
  const target = new Intl.DateTimeFormat("en-GB", {
    timeZone: TARGET_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const parts = Object.fromEntries(
    target
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    hour: Number(parts.hour),
    minute: Number(parts.minute),
  };
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
    },
  });
}

export async function dispatchDinnerReminder(env, now, options = {}) {
  if (!env.GITHUB_TOKEN) {
    throw new Error("GITHUB_TOKEN secret is not configured.");
  }

  const localTime = getTargetTime(now);
  if (!options.force && localTime.hour !== 18) {
    return {
      dispatched: false,
      reason: `Outside ${TARGET_TIME_ZONE} dinner hour.`,
      localTime,
    };
  }

  const owner = env.GITHUB_OWNER || DEFAULT_OWNER;
  const repo = env.GITHUB_REPO || DEFAULT_REPO;
  const workflowId = env.GITHUB_WORKFLOW_ID || DEFAULT_WORKFLOW_ID;
  const ref = env.GITHUB_REF || DEFAULT_REF;
  const url = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowId}/dispatches`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      accept: "application/vnd.github+json",
      authorization: `Bearer ${env.GITHUB_TOKEN}`,
      "content-type": "application/json",
      "user-agent": "must-feed-cloudflare-scheduler",
      "x-github-api-version": "2022-11-28",
    },
    body: JSON.stringify({
      ref,
      inputs: {
        bypass_time_window: "false",
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub dispatch failed (${response.status}): ${text.slice(0, 500)}`);
  }

  return {
    dispatched: true,
    localTime,
    workflow: `${owner}/${repo}/${workflowId}`,
    ref,
  };
}

export default {
  async scheduled(_controller, env, ctx) {
    ctx.waitUntil(
      dispatchDinnerReminder(env, new Date()).catch((error) => {
        console.error(error);
        throw error;
      }),
    );
  },

  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== "/dispatch") {
      return jsonResponse({
        ok: true,
        service: "must-feed dinner scheduler",
        endpoint: "/dispatch",
      });
    }

    if (!env.SCHEDULER_TOKEN) {
      return jsonResponse({ ok: false, error: "Manual dispatch is not enabled." }, 403);
    }

    const authorization = request.headers.get("authorization") || "";
    if (authorization !== `Bearer ${env.SCHEDULER_TOKEN}`) {
      return jsonResponse({ ok: false, error: "Unauthorized." }, 401);
    }

    const result = await dispatchDinnerReminder(env, new Date(), {
      force: url.searchParams.get("force") === "1",
    });
    return jsonResponse(result);
  },
};
