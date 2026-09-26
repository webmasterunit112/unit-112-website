import { json, currentUser, checkPassword, setPassword } from '../../lib/auth.js';

// POST /api/password {current, next} -> change the logged-in account's own password
export async function onRequestPost({ request, env }) {
  const who = await currentUser(request, env);
  if (!who) return json({ error: 'login required' }, 401);
  const { current = '', next = '' } = await request.json().catch(() => ({}));
  if (!(await checkPassword(env, who.username, String(current)))) return json({ error: 'wrong current password' }, 403);
  if (String(next).length < 10) return json({ error: 'too short' }, 400);
  await setPassword(env, who.username, String(next));
  return json({ ok: true });
}
