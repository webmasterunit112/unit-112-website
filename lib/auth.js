// Shared helpers for the Cloudflare Pages Functions.
// Needs: KV namespace bound as SITE_KV; secrets ADMIN_PASSWORD and SESSION_SECRET.
const enc = new TextEncoder();
export const b64u = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64u = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

export const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });

async function hmacKey(secret) {
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}
export async function sign(env, text) { return b64u(await crypto.subtle.sign('HMAC', await hmacKey(env.SESSION_SECRET), enc.encode(text))); }

export async function makeToken(env, username, hours = 12) {
  const payload = b64u(enc.encode(JSON.stringify({ u: username, exp: Date.now() + hours * 3600e3 })));
  return payload + '.' + (await sign(env, payload));
}
async function tokenUser(request, env) {
  const h = request.headers.get('authorization') || '';
  const tok = h.startsWith('Bearer ') ? h.slice(7) : '';
  const [payload, sig] = tok.split('.');
  if (!payload || !sig || !env.SESSION_SECRET) return null;
  try {
    const ok = await crypto.subtle.verify('HMAC', await hmacKey(env.SESSION_SECRET), unb64u(sig), enc.encode(payload));
    if (!ok) return null;
    const { u, exp } = JSON.parse(new TextDecoder().decode(unb64u(payload)));
    return Date.now() < exp ? u || 'webmaster' : null;
  } catch { return null; }
}

// ---- accounts ----
// "webmaster" is the owner account. Other accounts live in KV under auth:users.
export const getUsers = async (env) => (await env.SITE_KV.get('auth:users', 'json')) || {};
export const putUsers = (env, users) => env.SITE_KV.put('auth:users', JSON.stringify(users));
export function publicUser(username, rec) {
  if (username === 'webmaster') return { username, name: 'Webmaster', role: 'owner', clubs: [], tournaments: [] };
  return { username, name: rec.name || username, role: rec.role, clubs: rec.clubs || [], tournaments: rec.tournaments || [] };
}
// The logged-in account, read fresh from KV so permission changes apply right away. null if not logged in.
export async function currentUser(request, env) {
  const u = await tokenUser(request, env);
  if (!u) return null;
  if (u === 'webmaster') return publicUser(u);
  const rec = (await getUsers(env))[u];
  return rec ? publicUser(u, rec) : null;
}
export const fullAccess = (who) => !!who && (who.role === 'owner' || who.role === 'editor');

// ---- passwords (PBKDF2-SHA256) ----
async function pbkdf2(password, salt, iterations = 100000) {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  return b64u(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256));
}
export function sameString(a, b) {
  if (a.length !== b.length) return false;
  let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return { salt: b64u(salt), iter: 100000, hash: await pbkdf2(password, salt) };
}
const verifyHash = async (password, h) => !!h && sameString(await pbkdf2(password, unb64u(h.salt), h.iter), h.hash);

// Webmaster: a password set from the admin panel (auth:password) wins over the ADMIN_PASSWORD secret.
export async function checkPassword(env, username, password) {
  if (!password) return false;
  if (username === 'webmaster') {
    const stored = await env.SITE_KV.get('auth:password', 'json');
    if (stored) return verifyHash(password, stored);
    return !!env.ADMIN_PASSWORD && sameString(password, env.ADMIN_PASSWORD);
  }
  const rec = (await getUsers(env))[username];
  return !!rec && verifyHash(password, rec.pw);
}
export async function setPassword(env, username, password) {
  const h = await hashPassword(password);
  if (username === 'webmaster') return env.SITE_KV.put('auth:password', JSON.stringify(h));
  const users = await getUsers(env);
  if (!users[username]) throw new Error('no such user');
  users[username].pw = h;
  await putUsers(env, users);
}

// Simple per-address rate limit. Returns true when the limit is reached.
export async function limited(env, request, bucket, max, seconds) {
  const key = 'rl:' + bucket + ':' + (request.headers.get('cf-connecting-ip') || 'unknown');
  const n = +(await env.SITE_KV.get(key)) || 0;
  if (n >= max) return true;
  await env.SITE_KV.put(key, String(n + 1), { expirationTtl: Math.max(60, seconds) });
  return false;
}
export const validEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(e || '').trim()) && String(e).length < 200;
