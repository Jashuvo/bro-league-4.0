// api/_lib/supabase.js
//
// The `const { createClient } = await import('@supabase/supabase-js'); const
// supabase = createClient(url, key, { auth: { persistSession: false } })`
// triple was copy-pasted into season-archive.js, warm-cache.js, and both
// one-off scripts — small, but it's exactly the kind of thing that drifts
// (one call site missing `persistSession: false`, a different env var
// typo'd) the same way the fetchWithRetry/CORS duplication in helpers.js
// used to. Two flavors, matching how every caller actually uses Supabase
// here: read-only (anon key, RLS-restricted) and read-write (service-role
// key, bypasses RLS — server-only, never sent to the browser).
export async function getSupabaseAnonClient() {
  const url = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  const { createClient } = await import('@supabase/supabase-js');
  return createClient(url, anonKey, { auth: { persistSession: false } });
}

export async function getSupabaseServiceClient() {
  const url = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  const { createClient } = await import('@supabase/supabase-js');
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}
