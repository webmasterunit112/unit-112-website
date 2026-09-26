import { json, limited, validEmail } from '../../lib/auth.js';

// POST /api/subscribe {email, name, website} — public sign-up for tournament reminders.
// "website" is a hidden trap field: people leave it empty, spam bots fill it in.
export async function onRequestPost({ request, env }) {
  const b = await request.json().catch(() => ({}));
  if (b.website) return json({ ok: true });
  if (!validEmail(b.email)) return json({ error: 'invalid email' }, 400);
  if (await limited(env, request, 'sub', 10, 3600)) return json({ error: 'too many' }, 429);
  const email = String(b.email).trim().toLowerCase();
  const subs = (await env.SITE_KV.get('subscribers', 'json')) || [];
  if (!subs.find((s) => s.email === email)) {
    subs.push({ email, name: String(b.name || '').slice(0, 80), date: new Date().toISOString().slice(0, 10) });
    await env.SITE_KV.put('subscribers', JSON.stringify(subs));
  }
  return json({ ok: true });
}
