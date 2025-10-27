import Koa from 'koa';
import Router from '@koa/router';
import { glob } from 'glob';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';

import mongoMock from '../mocks/mongoMock.js';
import redisMock from '../mocks/redisMock.js';
import opensearchMock from '../mocks/opensearchMock.js';
import jsonBodyParser from '../lib/middleware/jsonBodyParser.js';
import requestLogger from '../lib/middleware/requestLogger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function initializeMocks() {
  if (!mongoMock.connected) {
    await mongoMock.connect('mongodb://mock:27017/mockdb');
  }

  if (!redisMock.connected) {
    await redisMock.connect();
  }

  if (!opensearchMock.connected) {
    await opensearchMock.connect({ node: 'http://mock-opensearch:9200' });
  }
}

async function loadRouters(rootRouter) {
  const routerFiles = await glob('lib/v1/**/router.js', {
    cwd: join(__dirname, '..'),
    absolute: true
  });

  for (const file of routerFiles) {
    const routerModule = await import(file);
    const router = routerModule.default;

    if (router && router.routes) {
      rootRouter.use(router.routes());
      rootRouter.use(router.allowedMethods());
    }
  }
}

function registerHealthRoute(rootRouter) {
  const buildStatus = () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      mongo: mongoMock.connected,
      redis: redisMock.connected,
      opensearch: opensearchMock.connected
    }
  });

  rootRouter.get('/health', async (ctx) => {
    ctx.body = buildStatus();
  });

  rootRouter.get('/', async (ctx) => {
    ctx.body = {
      ...buildStatus(),
      message: 'Koa Vercel POC API'
    };
  });

  rootRouter.get('/ping', async (ctx) => {
    ctx.body = {
      status: 'ok',
      message: 'pong',
      timestamp: new Date().toISOString()
    };
  });
}

function applyErrorHandling(app) {
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
}

function applyNotFoundHandler(app) {
  app.use(async (ctx, next) => {
    await next();

    if (ctx.status === 404 && !ctx.body) {
      ctx.status = 404;
      ctx.body = {
        error: {
          message: 'Not Found',
          status: 404,
          timestamp: new Date().toISOString()
        }
      };
    }
  });
}

export async function createApp() {
  await initializeMocks();

  const app = new Koa();
  applyErrorHandling(app);
  app.use(jsonBodyParser);
  app.use(requestLogger);

  const rootRouter = new Router();
  registerHealthRoute(rootRouter);
  await loadRouters(rootRouter);

  app.use(rootRouter.routes());
  app.use(rootRouter.allowedMethods());
  applyNotFoundHandler(app);

  return app;
}

const appInstance = await createApp();

const isDirectExecution =
  Boolean(process.argv[1]) &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectExecution) {
  const port = process.env.PORT || 3000;
  // Keep the API running when invoked via `node api/server.js`
  appInstance.listen(port, () => {
    console.log(`API server listening on http://localhost:${port}`);
  });
}

export const app = appInstance;

export default appInstance.callback();
