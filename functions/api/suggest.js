import { json, currentUser, limited, validEmail } from '../../lib/auth.js';

// Website suggestions from the Contact page.
// POST (public) {message, page, name, email, website} -> saved, and emailed to the webmaster's chosen address if Resend is set up.
// GET (webmaster) -> {to, suggestions}; PUT (webmaster) {to} -> change the destination address; DELETE ?key= -> remove one.
// The destination address is kept out of the public site content so it can't be harvested by spammers.
export const DEFAULT_TO = 'noahbellbridge@gmail.com';
const getTo = async (env) => ((await env.SITE_KV.get('config:private', 'json')) || {}).suggestTo || DEFAULT_TO;

export async function onRequestPost({ request, env }) {
  const b = await request.json().catch(() => ({}));
  if (b.website) return json({ ok: true });                       // spam-bot trap
  const message = String(b.message || '').trim().slice(0, 5000);
  if (message.length < 3) return json({ error: 'Please write your suggestion.' }, 400);
  const email = String(b.email || '').trim().slice(0, 200);
  if (email && !validEmail(email)) return json({ error: 'That email address does not look right.' }, 400);
  if (await limited(env, request, 'suggest', 5, 3600)) return json({ error: 'too many' }, 429);
  const s = { date: new Date().toISOString(), page: String(b.page || '').slice(0, 80), name: String(b.name || '').slice(0, 80), email, message };
  await env.SITE_KV.put('suggestion:' + s.date, JSON.stringify(s), { expirationTtl: 365 * 86400 });

  let emailed = false;
  if (env.RESEND_API_KEY && env.MAIL_FROM) {
    const to = await getTo(env);
    const text = `New website suggestion\n\nPage: ${s.page || 'General'}\nFrom: ${s.name || '(no name)'}${email ? ' <' + email + '>' : ''}\n\n${message}\n\n--\nSent from the suggestion form on ${new URL(request.url).origin}/#contact`;
    const r = await fetch((env.RESEND_URL || 'https://api.resend.com') + '/emails', {
      method: 'POST', headers: { authorization: 'Bearer ' + env.RESEND_API_KEY, 'content-type': 'application/json' },
      body: JSON.stringify(Object.assign({ from: env.MAIL_FROM, to: [to], subject: 'Website suggestion' + (s.page ? ': ' + s.page : ''), text }, email ? { reply_to: email } : {})),
    }).catch(() => null);
    emailed = !!(r && r.ok);
  }
  return json({ ok: true, emailed });
}

async function owner(request, env) {
  const who = await currentUser(request, env);
  if (!who) return json({ error: 'login required' }, 401);
  if (who.role !== 'owner') return json({ error: 'webmaster only' }, 403);
  return null;
}
export async function onRequestGet({ request, env }) {
  const g = await owner(request, env); if (g) return g;
  const list = await env.SITE_KV.list({ prefix: 'suggestion:' });
  const keys = list.keys.map((k) => k.name).sort().reverse().slice(0, 100);
  const suggestions = [];
  for (const k of keys) { const v = await env.SITE_KV.get(k, 'json'); if (v) suggestions.push(Object.assign({ key: k }, v)); }
  return json({ to: await getTo(env), emailReady: !!(env.RESEND_API_KEY && env.MAIL_FROM), suggestions });
}
export async function onRequestPut({ request, env }) {
  const g = await owner(request, env); if (g) return g;
  const b = await request.json().catch(() => ({}));
  if (!validEmail(b.to)) return json({ error: 'That email address does not look right.' }, 400);
  const cfg = (await env.SITE_KV.get('config:private', 'json')) || {};
  cfg.suggestTo = String(b.to).trim();
  await env.SITE_KV.put('config:private', JSON.stringify(cfg));
  return json({ ok: true, to: cfg.suggestTo });
}
export async function onRequestDelete({ request, env }) {
  const g = await owner(request, env); if (g) return g;
  const key = new URL(request.url).searchParams.get('key') || '';
  if (key.startsWith('suggestion:')) await env.SITE_KV.delete(key);
  return json({ ok: true });
}
