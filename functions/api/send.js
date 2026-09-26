import { json, currentUser, fullAccess, sign, validEmail } from '../../lib/auth.js';

// Tournament reminder emails through Resend (resend.com). Webmaster / editors only.
// Needs secrets RESEND_API_KEY and MAIL_FROM, e.g.  ACBL Unit 112 <reminders@yourdomain.org>
// POST {subject, text, test}   -> one test email to `test`
// POST {subject, text}         -> new send to every subscriber
// POST {continueId}            -> keep going with a send that hit the daily limit
// GET                          -> {campaigns:[{id, subject, date, sent, remaining}]}
async function guard(request, env) {
  const who = await currentUser(request, env);
  if (!who) return json({ error: 'login required' }, 401);
  if (!fullAccess(who)) return json({ error: 'not allowed' }, 403);
  return null;
}

async function footer(env, origin, email) {
  const link = `${origin}/api/unsubscribe?e=${encodeURIComponent(email)}&s=${await sign(env, 'unsub:' + email)}`;
  return { link, text: `\n\n--\nYou signed up for tournament reminders at ${origin}.\nUnsubscribe: ${link}` };
}
async function sendBatch(env, origin, subject, text, emails) {
  const items = [];
  for (const email of emails) {
    const f = await footer(env, origin, email);
    items.push({ from: env.MAIL_FROM, to: [email], subject, text: text + f.text, headers: { 'List-Unsubscribe': `<${f.link}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' } });
  }
  const r = await fetch((env.RESEND_URL || 'https://api.resend.com') + '/emails/batch', { method: 'POST', headers: { authorization: 'Bearer ' + env.RESEND_API_KEY, 'content-type': 'application/json' }, body: JSON.stringify(items) });
  if (!r.ok) { const body = await r.text(); return { ok: false, status: r.status, body }; }
  return { ok: true };
}
async function run(env, origin, c) {
  const done = new Set(c.sent);
  const pending = c.recipients.filter((e) => !done.has(e));
  let sentNow = 0, error = null;
  for (let i = 0; i < pending.length; i += 100) {
    const chunk = pending.slice(i, i + 100);
    const res = await sendBatch(env, origin, c.subject, c.text, chunk);
    if (!res.ok) { error = res.status === 429 ? 'Daily sending limit reached. Press "Continue sending" tomorrow.' : 'The email service refused the send (' + res.status + '). Check MAIL_FROM and your Resend domain.'; break; }
    c.sent.push(...chunk); sentNow += chunk.length;
  }
  await env.SITE_KV.put('mail:campaign:' + c.id, JSON.stringify(c), { expirationTtl: 180 * 86400 });
  return { sent: sentNow, remaining: c.recipients.length - c.sent.length, error };
}

export async function onRequestPost({ request, env }) {
  const g = await guard(request, env); if (g) return g;
  if (!env.RESEND_API_KEY || !env.MAIL_FROM) return json({ error: "Email sending isn't set up yet. Add RESEND_API_KEY and MAIL_FROM in Cloudflare (README, step 8)." }, 501);
  const origin = new URL(request.url).origin;
  const b = await request.json().catch(() => ({}));
  if (b.continueId) {
    const c = await env.SITE_KV.get('mail:campaign:' + b.continueId, 'json');
    if (!c) return json({ error: 'That send was not found.' }, 404);
    const r = await run(env, origin, c);
    return r.error && !r.sent ? json({ error: r.error }, 429) : json(r);
  }
  const subject = String(b.subject || '').slice(0, 200), text = String(b.text || '').slice(0, 20000);
  if (!subject || !text) return json({ error: 'Subject and message are required.' }, 400);
  if (b.test) {
    if (!validEmail(b.test)) return json({ error: 'Test address is not valid.' }, 400);
    const res = await sendBatch(env, origin, subject, text, [String(b.test).trim()]);
    return res.ok ? json({ sent: 1, remaining: 0 }) : json({ error: 'The email service refused the test (' + res.status + '). ' + res.body.slice(0, 200) }, 502);
  }
  const subs = (await env.SITE_KV.get('subscribers', 'json')) || [];
  if (!subs.length) return json({ error: 'There are no subscribers yet.' }, 400);
  const c = { id: Date.now().toString(36), subject, text, date: new Date().toISOString(), recipients: subs.map((s) => s.email), sent: [] };
  const r = await run(env, origin, c);
  return r.error && !r.sent ? json({ error: r.error }, 502) : json(r);
}

export async function onRequestGet({ request, env }) {
  const g = await guard(request, env); if (g) return g;
  const page = await env.SITE_KV.list({ prefix: 'mail:campaign:' });
  const out = [];
  for (const k of page.keys.slice(-20)) {
    const c = await env.SITE_KV.get(k.name, 'json');
    if (c) out.push({ id: c.id, subject: c.subject, date: c.date, sent: c.sent.length, remaining: c.recipients.length - c.sent.length });
  }
  return json({ campaigns: out.reverse() });
}
