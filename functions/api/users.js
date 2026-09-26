import { json, currentUser, getUsers, putUsers, publicUser, hashPassword } from '../../lib/auth.js';

// Editor accounts. Webmaster only.
// GET -> {users}; POST {username, name, role, clubs, tournaments, password?} -> create/update; DELETE ?u=username
const ROLES = ['editor', 'club', 'tournament'];
async function guard(request, env) {
  const who = await currentUser(request, env);
  if (!who) return json({ error: 'login required' }, 401);
  if (who.role !== 'owner') return json({ error: 'webmaster only' }, 403);
  return null;
}
export async function onRequestGet({ request, env }) {
  const g = await guard(request, env); if (g) return g;
  const users = await getUsers(env);
  return json({ users: [publicUser('webmaster')].concat(Object.keys(users).sort().map((u) => publicUser(u, users[u]))) });
}
export async function onRequestPost({ request, env }) {
  const g = await guard(request, env); if (g) return g;
  const b = await request.json().catch(() => ({}));
  const username = String(b.username || '').trim().toLowerCase();
  if (!/^[a-z0-9._-]{3,30}$/.test(username) || username === 'webmaster') return json({ error: 'Username: 3–30 lowercase letters or numbers (not "webmaster").' }, 400);
  if (!ROLES.includes(b.role)) return json({ error: 'Unknown role.' }, 400);
  const users = await getUsers(env);
  const rec = users[username] || {};
  if (!rec.pw && !b.password) return json({ error: 'A new account needs a password.' }, 400);
  if (b.password && String(b.password).length < 10) return json({ error: 'Passwords need at least 10 characters.' }, 400);
  const ids = (a) => (Array.isArray(a) ? a.map(String).slice(0, 200) : []);
  users[username] = {
    name: String(b.name || username).slice(0, 80), role: b.role,
    clubs: b.role === 'club' ? ids(b.clubs) : [], tournaments: b.role === 'tournament' ? ids(b.tournaments) : [],
    pw: b.password ? await hashPassword(String(b.password)) : rec.pw,
  };
  await putUsers(env, users);
  return json({ ok: true });
}
export async function onRequestDelete({ request, env }) {
  const g = await guard(request, env); if (g) return g;
  const u = new URL(request.url).searchParams.get('u');
  const users = await getUsers(env);
  delete users[u];
  await putUsers(env, users);
  return json({ ok: true });
}
