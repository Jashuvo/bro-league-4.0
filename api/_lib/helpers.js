// api/_lib/helpers.js
//
// Shared helpers for the FPL proxy functions in api/*.js. This used to be
// copy-pasted (with small, drifting differences) into league-complete.js
// and live-stats.js, while bootstrap.js/manager-history.js/team-picks.js
// each passed a `timeout` option straight into native fetch() — which
// fetch silently ignores, so those routes had no real client-side timeout
// at all and relied entirely on Vercel killing the function. Import from
// here instead of re-declaring any of this in a new route.

export const USER_AGENT = 'BRO-League-4.0/1.0';

/**
 * Sets the standard CORS headers this project's API routes all respond
 * with. Call at the top of every handler, before any early return.
 */
export function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

/**
 * Every FPL entry/event/league ID is a positive integer — several routes
 * (team-picks, manager-history, fixtures, league-transfers) build a
 * fantasy.premierleague.com URL by interpolating a raw query-string value
 * straight into it. Not a security boundary (this is a public HTTPS
 * fetch, not a filesystem/shell/SQL context — there's no path-traversal
 * or injection concern here), just fails fast with a clear 400 instead of
 * whatever confusing error FPL's own API returns for a malformed id.
 */
export function isValidId(value) {
  return /^\d+$/.test(String(value ?? ''));
}

/**
 * fetch() with a real timeout (native fetch ignores a `timeout` option —
 * this uses AbortController instead) and exponential-backoff retries on
 * network errors or non-OK responses.
 *
 * The cache-busting query param is load-bearing, not defensive boilerplate.
 * Root-caused via a temporary debug endpoint that surfaced the raw headers
 * this function actually received from FPL: `entry/{id}/`'s response
 * carried `age: 5756`, `x-cache: MISS, MISS, HIT`, and
 * `edge-control: max-age=1209600` (14 days) — FPL's own Fastly CDN was
 * serving an hours-old cached copy from whichever edge node Vercel's
 * requests land on, OVERRIDING the `Cache-Control: no-store` header FPL
 * sends to browsers (`Edge-Control`/`Surrogate-Control` are Fastly's
 * origin-to-CDN-only override of the client-facing Cache-Control). An
 * out-of-band curl to the identical URL got fresh data every time —
 * proving this is specific to whatever edge node Vercel's traffic hits,
 * not this app's own caching layers (KV, `force=true`, and even
 * `cache: 'no-store'` on the fetch itself all sit in FRONT of FPL's CDN
 * and can't touch a cache decision made on FPL's side).
 *
 * A unique query param on every call changes Fastly's cache key so it can
 * never match whatever stale object is sitting at that edge node — the
 * standard workaround for an upstream CDN that won't honor no-cache.
 * `cache: 'no-store'` stays too, as harmless defense-in-depth for
 * whatever fetch-level caching Vercel's own runtime might apply.
 */
export async function fetchWithRetry(url, options = {}, retries = 2) {
  const { timeout = 10000, ...rest } = options;
  const bustedUrl = `${url}${url.includes('?') ? '&' : '?'}_cb=${Date.now()}`;

  for (let i = 0; i <= retries; i++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(bustedUrl, {
        ...rest,
        cache: 'no-store',
        signal: controller.signal,
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'application/json',
          ...rest.headers
        }
      });

      if (!response.ok && i < retries) {
        console.log(`Retry ${i + 1}/${retries} for ${url} (status ${response.status})`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        continue;
      }

      return response;
    } catch (error) {
      if (i === retries) {
        throw error.name === 'AbortError'
          ? new Error(`Request timed out after ${timeout}ms: ${url}`)
          : error;
      }
      console.log(`Retry ${i + 1}/${retries} after error: ${error.message}`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

/** Caps how many async jobs run at once — used to fan out per-manager
 * requests without overwhelming the FPL API or the function's own time
 * budget. */
export class ConcurrencyLimiter {
  constructor(maxConcurrent) {
    this.maxConcurrent = maxConcurrent;
    this.running = 0;
    this.queue = [];
  }

  async run(fn) {
    while (this.running >= this.maxConcurrent) {
      await new Promise(resolve => this.queue.push(resolve));
    }

    this.running++;
    try {
      return await fn();
    } finally {
      this.running--;
      const resolve = this.queue.shift();
      if (resolve) resolve();
    }
  }
}
