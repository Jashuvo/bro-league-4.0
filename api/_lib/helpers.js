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
 * fetch() with a real timeout (native fetch ignores a `timeout` option —
 * this uses AbortController instead) and exponential-backoff retries on
 * network errors or non-OK responses.
 *
 * `cache: 'no-store'` is load-bearing, not defensive boilerplate: Vercel's
 * Node runtime applies its own Data Cache to outbound `fetch()` calls
 * regardless of what cache headers FPL's response carries — this app's own
 * KV cache and `force=true` bypass only sit in FRONT of that (in
 * league-complete.js), so they can look like they're forcing a fresh
 * fetch while this layer quietly hands back a memoized response for the
 * exact same URL. That's precisely why `entry/{id}/`'s overall rank could
 * stay pinned to a months-old value while everything sourced from the
 * (differently-cached) standings URL kept moving — confirmed by comparing
 * the frozen number against FPL's own historical record for that
 * manager, then reproducing correct fresh values with an out-of-band
 * curl to the identical URL. `no-store` opts every call here out of that
 * cache explicitly, per Vercel's own documented escape hatch.
 */
export async function fetchWithRetry(url, options = {}, retries = 2) {
  const { timeout = 10000, ...rest } = options;

  for (let i = 0; i <= retries; i++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
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
