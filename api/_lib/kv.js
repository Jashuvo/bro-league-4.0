// api/_lib/kv.js
//
// A get/set cache wrapper backed by `ioredis`, keyed off `REDIS_URL`.
//
// league-complete.js and fixtures.js used to import `@vercel/kv` directly,
// which requires `KV_REST_API_URL` + `KV_REST_API_TOKEN` (a REST proxy in
// front of Redis — Vercel's now-retired "KV" product). This project's
// actual Redis is a Marketplace Redis Cloud add-on, which only sets
// `REDIS_URL` (a plain `redis://` connection string) — `@vercel/kv` never
// found its expected env vars, so every `kv.get`/`kv.set` call has always
// thrown "Missing required environment variables" and been silently
// swallowed by the existing try/catch. In production, caching has
// therefore never actually worked at all — every single request has always
// paid the full cold-fetch cost. This is likely THE primary cause of
// "every visit is slow", more than the short TTL fixed alongside it.
//
// Exports `kv` as `null` (same soft-fail contract the rest of api/*.js
// already expects) when REDIS_URL isn't set, or a small {get,set} wrapper
// over an ioredis client otherwise. Values are JSON-serialized on the way
// in/out since raw Redis only stores strings.
import Redis from 'ioredis';

function createKv() {
  const url = process.env.REDIS_URL;
  if (!url) return null;

  // Serverless-friendly settings: fail fast rather than buffering commands
  // indefinitely while reconnecting across a cold start, and don't retry
  // forever — a hung Redis call shouldn't eat into the function's own
  // timeout budget. The client itself is a module-level singleton, so a
  // warm invocation (same container reused) keeps its connection instead
  // of reconnecting every request.
  const client = new Redis(url, {
    maxRetriesPerRequest: 2,
    connectTimeout: 5000,
    lazyConnect: false,
  });
  client.on('error', (err) => console.error('⚠️ Redis client error:', err.message));

  return {
    async get(key) {
      const raw = await client.get(key);
      return raw ? JSON.parse(raw) : null;
    },
    async set(key, value, { ex } = {}) {
      const raw = JSON.stringify(value);
      if (ex) {
        await client.set(key, raw, 'EX', ex);
      } else {
        await client.set(key, raw);
      }
    },
  };
}

export const kv = createKv();
