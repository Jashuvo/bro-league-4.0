// api/season-archive.js
//
// Read-only proxy over the `season_archive` table in Supabase — past
// seasons' final standings (and, from 2026/27 onward, weekly/monthly
// winners captured live). See SUPABASE_ARCHIVE_PLAN.md for the full spec.
//
// Mirrors the "optional everywhere" pattern the rest of api/*.js uses for
// KV: if Supabase isn't configured (or the query fails), degrade to an
// empty array rather than a 500 — an archive with nothing in it yet is a
// normal, expected state, not an error.
import { setCorsHeaders } from './_lib/helpers.js';

export default async function handler(req, res) {
  setCorsHeaders(res);
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { leagueId, season } = req.query;

  if (!leagueId) {
    return res.status(400).json({ success: false, error: 'leagueId is required' });
  }

  const url = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    // No archive configured yet — not an error, just nothing to show.
    return res.status(200).json({ success: true, data: [] });
  }

  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(url, anonKey);

    let query = supabase.from('season_archive').select('*').eq('league_id', String(leagueId));
    if (season) query = query.eq('season', season);

    const { data, error } = await query.order('final_rank', { ascending: true, nullsFirst: false });
    if (error) throw error;

    return res.status(200).json({ success: true, data: data || [] });
  } catch (error) {
    console.error('⚠️ season-archive query failed, degrading to empty:', error.message);
    return res.status(200).json({ success: true, data: [] });
  }
}
