import Koa from 'koa';
import Router from '@koa/router';
import { glob } from 'glob';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Import mocks
import mongoMock from '../mocks/mongoMock.js';
import redisMock from '../mocks/redisMock.js';
import opensearchMock from '../mocks/opensearchMock.js';
import apiGatewayMock from '../mocks/apiGatewayMock.js';
import s3Mock from '../mocks/s3Mock.js';
import sqsMock from '../mocks/sqsMock.js';

const app = new Koa();
const rootRouter = new Router();

// Get directory name for ES modules
const __dirname = dirname(fileURLToPath(import.meta.url));

// Initialize all mocks
async function initializeMocks() {
  console.log('Initializing mock services...');
  
  await mongoMock.connect('mongodb://mock:27017/mockdb');
  await redisMock.connect();
  await opensearchMock.connect({ node: 'http://mock-opensearch:9200' });
  
  console.log('All mock services initialized');
}

// Load all routers dynamically
async function loadRouters() {
  const routerFiles = await glob('lib/v1/**/router.js', {
    cwd: join(__dirname, '..'),
    absolute: true
  });

  for (const file of routerFiles) {
    const router = (await import(file)).default;
    if (router && router.routes) {
      console.log(`Loading routes from ${file}`);
      rootRouter.use(router.routes());
      rootRouter.use(router.allowedMethods());
    }
  }
}

// Health check route
rootRouter.get('/health', async (ctx) => {
  ctx.body = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      mongo: mongoMock.connected,
      redis: redisMock.connected,
      opensearch: opensearchMock.connected
    }
  };
});

// Error handling middleware
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    console.error('Error:', err);
    ctx.status = err.status || 500;
    ctx.body = {
      error: {
        message: err.message,
        status: ctx.status,
        timestamp: new Date().toISOString()
      }
    };
  }
});

// Initialize mocks and load routes
await initializeMocks();
await loadRouters();

// Use the root router
app.use(rootRouter.routes());
app.use(rootRouter.allowedMethods());

// Export for Vercel
export default app.callback();