import { json, makeToken, checkPassword, getUsers, publicUser } from '../../lib/auth.js';

// POST /api/login {username, password} -> {token, user}. Locks an address out for 15 minutes after 10 wrong tries.
export async function onRequestPost({ request, env }) {
  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  const key = 'fail:' + ip;
  const fails = +(await env.SITE_KV.get(key)) || 0;
  if (fails >= 10) return json({ error: 'Too many attempts. Try again in 15 minutes.' }, 429);
  const body = await request.json().catch(() => ({}));
  const username = String(body.username || 'webmaster').trim().toLowerCase();
  if (await checkPassword(env, username, String(body.password || ''))) {
    if (fails) await env.SITE_KV.delete(key);
    const rec = username === 'webmaster' ? null : (await getUsers(env))[username];
    return json({ token: await makeToken(env, username), user: publicUser(username, rec) });
  }
  await env.SITE_KV.put(key, String(fails + 1), { expirationTtl: 900 });
  return json({ error: 'wrong username or password' }, 401);
}
