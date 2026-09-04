// api/season-archive.js
//
// Two Supabase-backed resources in one function, not two — Vercel's Hobby
// plan caps a deployment at 12 Serverless Functions, and this project is
// already at that cap (see api/warm-cache.js's own comment about why it
// absorbed a second cron for the same reason).
//
// `?resource=exclusions` (default: `season_archive`) switches to the
// shared "excluded from prizes" list — the one and only place that list
// lives now (see excluded_managers migration). It used to live only in
// each browser's localStorage, which meant every viewer could see a
// different table AND api/warm-cache.js's archive cron had no way to know
// who was excluded when crowning weekly/monthly winners.
//
// Mirrors the "optional everywhere" pattern the rest of api/*.js uses for
// KV: if Supabase isn't configured (or a read fails), degrade to an empty
// array rather than a 500 — nothing archived/excluded yet is a normal,
// expected state, not an error.
import { setCorsHeaders } from './_lib/helpers.js';

async function handleSeasonArchive(req, res, supabase, leagueId) {
  const { season } = req.query;
  let query = supabase.from('season_archive').select('*').eq('league_id', String(leagueId));
  if (season) query = query.eq('season', season);

  const { data, error } = await query.order('final_rank', { ascending: true, nullsFirst: false });
  if (error) throw error;

  return res.status(200).json({ success: true, data: data || [] });
}

async function handleExclusions(req, res, supabase, leagueId) {
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('excluded_managers')
      .select('*')
      .eq('league_id', String(leagueId))
      .order('created_at', { ascending: true });
    if (error) throw error;
    return res.status(200).json({ success: true, data: data || [] });
  }

  // POST (exclude) / DELETE (restore) both change shared state everyone
  // sees, so they're gated by a shared PIN instead of the anon key alone
  // (which is public-read only, by RLS design — see the migration). Not
  // real auth, just enough friction that this stays a deliberate action
  // on a private league nobody outside the group has a link to.
  const pin = process.env.EXCLUSION_PIN;
  if (pin && req.headers['x-exclusion-pin'] !== pin) {
    return res.status(401).json({ success: false, error: 'Wrong or missing PIN' });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return res.status(503).json({ success: false, error: 'Exclusions are read-only until SUPABASE_SERVICE_ROLE_KEY is configured' });
  }
  // Re-create the client with the service-role key for this write — the
  // caller-supplied `supabase` above was built with the anon key, which
  // RLS blocks from writing here on purpose.
  const { createClient } = await import('@supabase/supabase-js');
  const writeClient = createClient(process.env.VITE_SUPABASE_URL, serviceKey, {
    auth: { persistSession: false },
  });

  if (req.method === 'POST') {
    const { managerId, managerName } = req.body || {};
    if (!managerId) return res.status(400).json({ success: false, error: 'managerId is required' });

    const { error } = await writeClient
      .from('excluded_managers')
      .upsert({ league_id: String(leagueId), manager_id: managerId, manager_name: managerName || null });
    if (error) throw error;
    return res.status(200).json({ success: true });
  }

  if (req.method === 'DELETE') {
    const { managerId, all } = req.query;
    let query = writeClient.from('excluded_managers').delete().eq('league_id', String(leagueId));
    if (!all) {
      if (!managerId) return res.status(400).json({ success: false, error: 'managerId is required (or pass all=true)' });
      query = query.eq('manager_id', managerId);
    }
    const { error } = await query;
    if (error) throw error;
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default async function handler(req, res) {
  setCorsHeaders(res);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-exclusion-pin');

  const { leagueId, resource = 'season_archive' } = req.query;

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const isExclusions = resource === 'exclusions';

  // Exclusions are read+write; season_archive stays GET-only.
  const allowedMethods = isExclusions ? ['GET', 'POST', 'DELETE'] : ['GET'];
  if (!allowedMethods.includes(req.method)) {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Writes change shared state — never let the CDN cache them or a
  // response to one request bleed into another's.
  res.setHeader(
    'Cache-Control',
    req.method === 'GET'
      ? 'public, s-maxage=3600, stale-while-revalidate=86400'
      : 'no-store'
  );

  if (!leagueId) {
    return res.status(400).json({ success: false, error: 'leagueId is required' });
  }

  const url = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    // No archive configured yet — not an error, just nothing to show (and
    // nothing writable, handled inside handleExclusions above).
    return res.status(200).json({ success: true, data: [] });
  }

  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(url, anonKey);

    if (isExclusions) {
      return await handleExclusions(req, res, supabase, leagueId);
    }
    return await handleSeasonArchive(req, res, supabase, leagueId);
  } catch (error) {
    console.error(`⚠️ ${resource} request failed:`, error.message);
    // A write failure should surface as an error (the caller needs to
    // know it didn't take) — only reads degrade silently to empty.
    if (req.method !== 'GET') {
      return res.status(500).json({ success: false, error: error.message });
    }
    return res.status(200).json({ success: true, data: [] });
  }
}
