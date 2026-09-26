// Link previews (email, texts, Facebook) need full web addresses for the page and its image.
// This fills them in from whatever domain the site is being served on, so nothing needs editing when the domain changes.
export async function onRequest({ request, next }) {
  const res = await next();
  const type = res.headers.get('content-type') || '';
  if (request.method !== 'GET' || !type.includes('text/html')) return res;
  const origin = new URL(request.url).origin;
  return new HTMLRewriter()
    .on('meta[property="og:image"]', { element(el) { el.setAttribute('content', origin + '/og-image.png'); } })
    .on('meta[property="og:url"]', { element(el) { el.setAttribute('content', origin + '/'); } })
    .on('link[rel="canonical"]', { element(el) { el.setAttribute('href', origin + '/'); } })
    .transform(res);
}
