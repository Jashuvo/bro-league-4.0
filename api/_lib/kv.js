// api/_lib/kv.js
//
// A get/set cache wrapper backed by the `kv_cache` table in Supabase.
//
// Third caching backend this project has tried: @vercel/kv (needs
// KV_REST_API_URL/KV_REST_API_TOKEN, which nothing here ever set) then a
// direct `ioredis` connection via REDIS_URL (which turned out to point at
// a Redis Cloud instance that no longer resolves at all — confirmed dead
// from Vercel's own production runtime, not just locally). Rather than
// chase a fourth Redis/KV provider, this reuses the Supabase project
// already wired up for the season archive — no new account/integration to
// provision, and it's already proven to work.
//
// Writes use the service-role key (server-only, bypasses RLS) — nothing
// about this table is reachable from the browser. `kv` is `null` (same
// soft-fail contract the rest of api/*.js expects) whenever Supabase isn't
// configured, so callers don't need to change based on which backend (or
// none) is active.
function createKv() {
  const url = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;

  let clientPromise = null;
  async function getClient() {
    if (!clientPromise) {
      clientPromise = import('@supabase/supabase-js').then(({ createClient }) =>
        createClient(url, serviceKey, { auth: { persistSession: false } })
      );
    }
    return clientPromise;
  }

  return {
    async get(key) {
      const supabase = await getClient();
      const { data, error } = await supabase
        .from('kv_cache')
        .select('value, expires_at')
        .eq('key', key)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      if (data.expires_at && new Date(data.expires_at).getTime() < Date.now()) return null;
      return data.value;
    },
    async set(key, value, { ex } = {}) {
      const supabase = await getClient();
      const { error } = await supabase.from('kv_cache').upsert({
        key,
        value,
        expires_at: ex ? new Date(Date.now() + ex * 1000).toISOString() : null,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
    },
  };
}

export const kv = createKv();
