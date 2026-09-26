// GET /files/<id>/<name> -> an uploaded logo, image or document
export async function onRequestGet({ params, env }) {
  const id = (params.path || [])[0];
  if (!id) return new Response('Not found', { status: 404 });
  const { value, metadata } = await env.SITE_KV.getWithMetadata('file:' + id, 'arrayBuffer');
  if (!value) return new Response('Not found', { status: 404 });
  return new Response(value, {
    headers: {
      'content-type': (metadata && metadata.type) || 'application/octet-stream',
      'content-disposition': 'inline; filename="' + ((metadata && metadata.name) || 'file').replace(/"/g, '') + '"',
      'cache-control': 'public, max-age=86400',
      'x-content-type-options': 'nosniff',
    },
  });
}
