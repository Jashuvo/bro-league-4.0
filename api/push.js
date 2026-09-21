// api/push.js
//
// Web-push plumbing for the matchday notifications: deadline reminders and
// "results are in" pings (the sending half lives in api/warm-cache.js's
// daily cron — this endpoint only manages WHO is subscribed).
//
// One function, not three — same reason as season-archive.js: Vercel's
// Hobby plan caps a deployment at 12 Serverless Functions and this project
// was already at 10 when this was added.
//
//   GET    → { publicKey }            the VAPID public key the browser
//                                     needs to subscribe (null when the
//                                     VAPID keys aren't configured — the
//                                     UI then hides the whole feature)
//   POST   → subscribe. Body: { endpoint, keys: { p256dh, auth } } —
//            exactly the shape PushSubscription JSON gives the browser.
//   DELETE → ?endpoint=...  remove one subscription (user turned
//            notifications off, or the push service reported the
//            subscription as gone).
//
// Subscriptions live in `push_subscriptions` (see its migration). Writes are
// made HERE with the service-role key, not with the browser's anon key:
// api/push.js saves with .upsert(onConflict: endpoint), which is INSERT ...
// ON CONFLICT — and Postgres (17, verified live) checks the table's SELECT
// policy for ANY on-conflict statement, even a non-conflicting one. That
// table deliberately has no SELECT policy (the subscriber list is
// server-side only), so an anon-keyed upsert always dies with "new row
// violates row-level security policy". Going through the service key inside
// this one server function keeps that invariant intact: the REST table stays
// anon-blind, and the input below is validated before it's ever written.
// No subscription is validated for ownership — anon can delete any
// endpoint it names. That's inherent to push (the endpoint URL is the
// credential) and harmless here: messages carry league-wide news, nothing
// per-user worth spoofing, and the real abuse risk (spamming sends) is
// gated behind warm-cache's CRON_SECRET, not this endpoint.
import { setCorsHeaders } from './_lib/helpers.js';
import { getSupabaseServiceClient } from './_lib/supabase.js';

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const leagueId = process.env.VITE_FPL_LEAGUE_ID;
  if (!leagueId) {
    return res.status(400).json({ success: false, error: 'VITE_FPL_LEAGUE_ID is not set' });
  }

  // The key distribution half works with or without Supabase — the browser
  // needs the public key before it can even ask to subscribe.
  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      publicKey: process.env.VAPID_PUBLIC_KEY || null,
    });
  }

  const supabase = await getSupabaseServiceClient();
  if (!supabase) {
    return res.status(200).json({ success: false, error: 'Subscriptions not configured (no Supabase service key)' });
  }

  try {
    if (req.method === 'POST') {
      const { endpoint, keys } = req.body || {};
      const p256dh = keys?.p256dh;
      const auth = keys?.auth;
      if (!endpoint || !p256dh || !auth) {
        return res.status(400).json({ success: false, error: 'endpoint and keys.p256dh/keys.auth are required' });
      }
      const { error } = await supabase.from('push_subscriptions').upsert(
        { league_id: String(leagueId), endpoint, p256dh, auth },
        { onConflict: 'endpoint' }
      );
      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    if (req.method === 'DELETE') {
      const { endpoint } = req.query;
      if (!endpoint) return res.status(400).json({ success: false, error: 'endpoint is required' });
      const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('endpoint', endpoint);
      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('⚠️ push request failed:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
}
