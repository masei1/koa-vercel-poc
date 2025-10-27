import Router from '@koa/router';
import opensearchMock from '../../../mocks/opensearchMock.js';

const router = new Router({
  prefix: '/v1/search'
});

// Search endpoint
router.get('/', async (ctx) => {
  const { q: query, index = 'default', limit = 10 } = ctx.query;

  if (!query) {
    ctx.status = 400;
    ctx.body = { error: 'Query parameter "q" is required' };
    return;
  }

  const result = await opensearchMock.search({
    index,
    body: {
      size: parseInt(limit),
      query: {
        match: {
          content: query
        }
      }
    }
  });

  ctx.body = {
    hits: result.body.hits.hits,
    total: result.body.hits.total.value,
    took: result.body.took
  };
});

// Index document
router.post('/:index/document', async (ctx) => {
  const { index } = ctx.params;
  const document = ctx.request.body;

  const result = await opensearchMock.index({
    index,
    body: document
  });

  ctx.status = 201;
  ctx.body = {
    id: result.body._id,
    index: result.body._index,
    result: result.body.result
  };
});

// Delete document
router.delete('/:index/document/:id', async (ctx) => {
  const { index, id } = ctx.params;

  try {
    const result = await opensearchMock.delete({
      index,
      id
    });

    ctx.status = 200;
    ctx.body = {
      id: result.body._id,
      index: result.body._index,
      result: result.body.result
    };
  } catch (_error) {
    ctx.status = 404;
    ctx.body = { error: 'Document not found' };
  }
});

export default router;
