import { json, currentUser, fullAccess } from '../../lib/auth.js';

// GET /api/site  -> the site content (null until the first save; the page then uses its built-in starting content)
export async function onRequestGet({ env }) {
  return json(await env.SITE_KV.get('site', 'json'));
}

// PUT /api/site  -> save content. Webmaster and editors save everything.
// Club managers and tournament chairs: only their assigned clubs / tournaments are taken from what they send.
export async function onRequestPut({ request, env }) {
  const who = await currentUser(request, env);
  if (!who) return json({ error: 'login required' }, 401);
  const text = await request.text();
  if (text.length > 20 * 1024 * 1024) return json({ error: 'too large' }, 413);
  let data;
  try { data = JSON.parse(text); } catch { return json({ error: 'not JSON' }, 400); }
  if (!data || !data.settings || !Array.isArray(data.pages)) return json({ error: 'not site content' }, 400);

  let out = data;
  if (!fullAccess(who)) {
    const cur = await env.SITE_KV.get('site', 'json');
    if (!cur) return json({ error: 'The webmaster must save the site once before helpers can edit.' }, 403);
    const key = who.role === 'club' ? 'clubs' : who.role === 'tournament' ? 'tournaments' : null;
    if (!key) return json({ error: 'not allowed' }, 403);
    const allowed = new Set(who[key] || []);
    out = cur;
    for (const item of Array.isArray(data[key]) ? data[key] : []) {
      if (!item || !allowed.has(item.id)) continue;
      const i = out[key].findIndex((x) => x.id === item.id);
      if (i >= 0) out[key][i] = item;
    }
  }
  const body = JSON.stringify(out);
  await env.SITE_KV.put('site', body);
  await env.SITE_KV.put('backup:' + new Date().toISOString(), body, { expirationTtl: 90 * 86400, metadata: { by: who.username } });
  return json({ ok: true });
}
