import request from 'supertest';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { glob } from 'glob';

// Import server components
import mongoMock from '../../mocks/mongoMock.js';
import redisMock from '../../mocks/redisMock.js';
import opensearchMock from '../../mocks/opensearchMock.js';

describe('Server Integration', () => {
  let app;
  const __dirname = dirname(fileURLToPath(import.meta.url));

  beforeEach(async () => {
    const serverModule = await import('../../api/server.js');
    app = await serverModule.createApp();
  });

  describe('Service Initialization', () => {
    it('should initialize all mock services', async () => {
      expect(mongoMock.connected).toBe(true);
      expect(redisMock.connected).toBe(true);
      expect(opensearchMock.connected).toBe(true);
    });

    it('should load all route files', async () => {
      const routerFiles = await glob('lib/v1/**/router.js', {
        cwd: join(__dirname, '../..'),
        absolute: true
      });

      expect(routerFiles.length).toBeGreaterThan(0);
    });
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app.callback())
        .get('/health')
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'ok',
        services: {
          mongo: true,
          redis: true,
          opensearch: true
        }
      });
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 errors', async () => {
      const response = await request(app.callback())
        .get('/non-existent-path')
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('status', 404);
      expect(response.body.error).toHaveProperty('timestamp');
    });

    it('should handle runtime errors', async () => {
      // Create a route that throws an error
      app.use(async (ctx) => {
        if (ctx.path === '/error') {
          throw new Error('Test error');
        }
      });

      const response = await request(app.callback())
        .get('/error')
        .expect(500);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatchObject({
        message: 'Test error',
        status: 500
      });
      expect(response.body.error).toHaveProperty('timestamp');
    });
  });
});
