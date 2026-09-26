// Serve the webmaster's uploaded site icon (Look & logo → Site icon) at the standard icon addresses,
// so it also shows in bookmarks, phone home screens and search results. Falls back to the default files in public/.
export async function customIcon({ env, next }) {
  try {
    const site = await env.SITE_KV.get('site', 'json');
    const fav = site && site.settings && site.settings.favicon;
    if (fav && fav.startsWith('/files/')) {
      const id = fav.split('/')[2];
      const { value, metadata } = await env.SITE_KV.getWithMetadata('file:' + id, 'arrayBuffer');
      if (value) return new Response(value, { headers: { 'content-type': (metadata && metadata.type) || 'image/png', 'cache-control': 'public, max-age=3600' } });
    }
    const m = fav && /^data:(image\/[\w+.-]+);base64,(.*)$/.exec(fav);
    if (m) return new Response(Uint8Array.from(atob(m[2]), (c) => c.charCodeAt(0)), { headers: { 'content-type': m[1], 'cache-control': 'public, max-age=3600' } });
  } catch (e) { /* use the default icon */ }
  return next();
}
