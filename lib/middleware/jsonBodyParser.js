/**
 * Minimal JSON body parser middleware for Koa.
 * Reads the request stream and populates ctx.request.body with a parsed object.
 */
export default async function jsonBodyParser(ctx, next) {
  if (ctx.request.body !== undefined) {
    return next();
  }

  if (['GET', 'HEAD'].includes(ctx.method)) {
    ctx.request.body = {};
    return next();
  }

  const contentType = ctx.get('content-type') || '';
  const isJson =
    contentType.includes('application/json') ||
    contentType.includes('text/json') ||
    contentType === '';

  if (!isJson) {
    ctx.request.body = {};
    return next();
  }

  const chunks = [];

  for await (const chunk of ctx.req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const rawBody = Buffer.concat(chunks).toString('utf8');

  if (!rawBody.trim()) {
    ctx.request.body = {};
    return next();
  }

  try {
    ctx.request.body = JSON.parse(rawBody);
  } catch (_error) {
    ctx.throw(400, 'Invalid JSON payload');
  }

  await next();
}
