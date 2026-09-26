import { json, currentUser, fullAccess, validEmail } from '../../lib/auth.js';

// Webmaster / editors: GET -> {subscribers}; POST {email, name} adds one; DELETE ?e=email removes one.
async function guard(request, env) {
  const who = await currentUser(request, env);
  if (!who) return json({ error: 'login required' }, 401);
  if (!fullAccess(who)) return json({ error: 'not allowed' }, 403);
  return null;
}
const load = async (env) => (await env.SITE_KV.get('subscribers', 'json')) || [];
export async function onRequestGet({ request, env }) {
  const g = await guard(request, env); if (g) return g;
  return json({ subscribers: await load(env) });
}
export async function onRequestPost({ request, env }) {
  const g = await guard(request, env); if (g) return g;
  const b = await request.json().catch(() => ({}));
  if (!validEmail(b.email)) return json({ error: 'invalid email' }, 400);
  const email = String(b.email).trim().toLowerCase(), subs = await load(env);
  if (!subs.find((s) => s.email === email)) subs.push({ email, name: String(b.name || '').slice(0, 80), date: new Date().toISOString().slice(0, 10) });
  await env.SITE_KV.put('subscribers', JSON.stringify(subs));
  return json({ ok: true });
}
export async function onRequestDelete({ request, env }) {
  const g = await guard(request, env); if (g) return g;
  const e = (new URL(request.url).searchParams.get('e') || '').toLowerCase();
  await env.SITE_KV.put('subscribers', JSON.stringify((await load(env)).filter((s) => s.email !== e)));
  return json({ ok: true });
}
