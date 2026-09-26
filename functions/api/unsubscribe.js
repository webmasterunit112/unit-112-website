import { sign, sameString } from '../../lib/auth.js';

// GET /api/unsubscribe?e=<email>&s=<signature> — the link at the bottom of every reminder email.
const page = (title, msg) => new Response(`<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title>
<style>body{font:20px/1.6 Verdana,system-ui,sans-serif;background:#F3F7F6;color:#15232B;margin:0;padding:48px 16px}main{max-width:36rem;margin:0 auto;background:#fff;border:1px solid #C9D6D6;border-radius:10px;padding:28px}h1{color:#1C4966;font-family:Georgia,serif}a{color:#1C4966}</style></head>
<body><main><h1>${title}</h1><p>${msg}</p><p><a href="/">Back to the Unit 112 website</a></p></main></body></html>`, { headers: { 'content-type': 'text/html; charset=utf-8' } });

async function handle(request, env) {
  const u = new URL(request.url), e = (u.searchParams.get('e') || '').toLowerCase(), s = u.searchParams.get('s') || '';
  if (!e || !sameString(s, await sign(env, 'unsub:' + e))) return page('Link not recognized', 'This unsubscribe link is not valid. Contact the webmaster and we will remove you by hand.');
  const subs = (await env.SITE_KV.get('subscribers', 'json')) || [];
  await env.SITE_KV.put('subscribers', JSON.stringify(subs.filter((x) => x.email !== e)));
  return page('You are unsubscribed', `We won't send tournament reminders to ${e.replace(/[<>&"]/g, '')} any more.`);
}
export const onRequestGet = ({ request, env }) => handle(request, env);
export const onRequestPost = ({ request, env }) => handle(request, env); // one-click unsubscribe from mail apps
