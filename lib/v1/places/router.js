import Router from '@koa/router';

import { getMapData } from '../../../mocks/placesMock.js';

const router = new Router({
  prefix: '/v1/places'
});

function parseBbox(value) {
  if (!value) {
    return null;
  }

  const parts = value.split(',').map((part) => Number.parseFloat(part.trim()));

  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
    return null;
  }

  const [west, south, east, north] = parts;

  if (west >= east || south >= north) {
    return null;
  }

  return { west, south, east, north };
}

async function applyDelay(delayMs) {
  if (!delayMs || delayMs <= 0) {
    return;
  }

  await new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });
}

router.get('/map', async (ctx) => {
  const start = Date.now();
  const bbox = parseBbox(ctx.query.bbox);
  const zoom = Number.parseInt(ctx.query.zoom, 10);
  const delayMs = Number.parseInt(ctx.query.delayMs ?? ctx.query.delay ?? '0', 10);

  if (!bbox) {
    ctx.status = 400;
    ctx.body = { error: 'Invalid bbox parameter. Expected format: west,south,east,north' };
    return;
  }

  if (Number.isNaN(zoom) || zoom < 0) {
    ctx.status = 400;
    ctx.body = { error: 'Invalid zoom parameter. Must be a positive integer.' };
    return;
  }

  if (!Number.isNaN(delayMs) && (delayMs < 0 || delayMs > 60000)) {
    ctx.status = 400;
    ctx.body = { error: 'delayMs must be between 0 and 60000 milliseconds.' };
    return;
  }

  const mapData = await getMapData({ bbox, zoom });

  await applyDelay(delayMs);

  const processingTimeMs = Date.now() - start;

  ctx.set('Cache-Control', 'public, max-age=30, s-maxage=120, stale-while-revalidate=60');
  ctx.body = {
    request: {
      bbox,
      zoom,
      delayMs: Number.isNaN(delayMs) ? 0 : delayMs
    },
    meta: {
      cacheKey: mapData.cacheKey,
      processingTimeMs,
      generatedAt: new Date().toISOString()
    },
    data: {
      clusters: mapData.clusters,
      markers: mapData.markers,
      polygons: mapData.polygons,
      total: mapData.total
    }
  };
});

export default router;
