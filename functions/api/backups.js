import { json, currentUser, fullAccess } from '../../lib/auth.js';

// GET /api/backups -> {backups:[{key,time,by}]} newest first; GET /api/backups?key=... -> that saved version
export async function onRequestGet({ request, env }) {
  const who = await currentUser(request, env);
  if (!who) return json({ error: 'login required' }, 401);
  if (!fullAccess(who)) return json({ error: 'not allowed' }, 403);
  const key = new URL(request.url).searchParams.get('key');
  if (key) {
    if (!key.startsWith('backup:')) return json({ error: 'bad key' }, 400);
    const v = await env.SITE_KV.get(key, 'json');
    return v ? json(v) : json({ error: 'not found' }, 404);
  }
  const keys = [];
  let cursor;
  do {
    const page = await env.SITE_KV.list({ prefix: 'backup:', cursor });
    keys.push(...page.keys);
    cursor = page.list_complete ? null : page.cursor;
  } while (cursor);
  keys.sort((a, b) => (a.name < b.name ? 1 : -1));
  return json({ backups: keys.slice(0, 40).map((k) => ({ key: k.name, time: k.name.slice(7), by: (k.metadata && k.metadata.by) || '' })) });
}
