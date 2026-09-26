import { json, currentUser } from '../../lib/auth.js';

// POST /api/upload (raw file body, headers content-type + x-filename) -> {url}. Any logged-in account.
// Files are kept in the same KV namespace (25 MB per file limit; we cap at 20 MB).
export async function onRequestPost({ request, env }) {
  if (!(await currentUser(request, env))) return json({ error: 'login required' }, 401);
  const buf = await request.arrayBuffer();
  if (buf.byteLength === 0) return json({ error: 'empty file' }, 400);
  if (buf.byteLength > 20 * 1024 * 1024) return json({ error: 'too large' }, 413);
  const type = request.headers.get('content-type') || 'application/octet-stream';
  const name = decodeURIComponent(request.headers.get('x-filename') || 'file').replace(/[^\w.\- ]+/g, '').slice(0, 120) || 'file';
  const id = crypto.randomUUID().replace(/-/g, '').slice(0, 16);
  await env.SITE_KV.put('file:' + id, buf, { metadata: { type, name } });
  return json({ url: '/files/' + id + '/' + encodeURIComponent(name) });
}
