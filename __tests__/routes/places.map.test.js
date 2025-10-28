import request from 'supertest';
import Koa from 'koa';
import Router from '@koa/router';

import placesRouter from '../../lib/v1/places/router.js';

describe('Places Router', () => {
  let app;

  beforeEach(() => {
    app = new Koa();
    const root = new Router();
    root.use(placesRouter.routes());
    root.use(placesRouter.allowedMethods());
    app.use(root.routes());
    app.use(root.allowedMethods());
  });

  const server = () => app.callback();

  describe('GET /v1/places/map', () => {
    it('returns 400 for missing bbox', async () => {
      const response = await request(server())
        .get('/v1/places/map?zoom=5')
        .expect(400);

      expect(response.body.error).toContain('bbox');
    });

    it('returns 400 for invalid zoom', async () => {
      const response = await request(server())
        .get('/v1/places/map?bbox=-125,32,-114,42&zoom=-1')
        .expect(400);

      expect(response.body.error).toContain('zoom');
    });

    it('returns clusters for low zoom', async () => {
      const response = await request(server())
        .get('/v1/places/map?bbox=-130,30,-110,45&zoom=5')
        .expect(200);

      expect(response.body.data.clusters.length).toBeGreaterThan(0);
      expect(response.body.data.markers).toHaveLength(0);
    });

    it('returns markers for mid zoom', async () => {
      const response = await request(server())
        .get('/v1/places/map?bbox=-125,32,-114,42&zoom=8')
        .expect(200);

      expect(response.body.data.clusters).toHaveLength(0);
      expect(response.body.data.markers.length).toBeGreaterThan(0);
    });

    it('returns polygons for high zoom when available', async () => {
      const response = await request(server())
        .get('/v1/places/map?bbox=-75,40,-70,42&zoom=12')
        .expect(200);

      expect(response.body.data.polygons.length).toBeGreaterThan(0);
    });

    it('enforces delay bounds', async () => {
      await request(server())
        .get('/v1/places/map?bbox=-125,32,-114,42&zoom=7&delayMs=65000')
        .expect(400);
    });

    it('returns metadata with cache control headers', async () => {
      const response = await request(server())
        .get('/v1/places/map?bbox=-125,32,-114,42&zoom=7')
        .expect(200);

      expect(response.headers['cache-control']).toContain('max-age');
      expect(response.body.meta).toHaveProperty('cacheKey');
      expect(response.body.meta).toHaveProperty('processingTimeMs');
    });
  });
});
