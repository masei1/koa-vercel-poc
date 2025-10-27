import Router from '@koa/router';
import s3Mock from '../../../mocks/s3Mock.js';

const router = new Router({
  prefix: '/v1/upload'
});

// Upload file
router.post('/', async (ctx) => {
  const { filename, contentType, fileSize } = ctx.request.body;
  
  if (!filename || !contentType) {
    ctx.status = 400;
    ctx.body = { error: 'filename and contentType are required' };
    return;
  }

  const key = `uploads/${Date.now()}-${filename}`;
  const result = await s3Mock.upload({
    Bucket: 'mock-bucket',
    Key: key,
    Body: Buffer.from('Mock file content'),
    ContentType: contentType
  }).promise();

  ctx.status = 201;
  ctx.body = {
    url: result.Location,
    key: result.Key,
    bucket: result.Bucket
  };
});

// Get file metadata
router.get('/:key', async (ctx) => {
  try {
    const result = await s3Mock.getObject({
      Bucket: 'mock-bucket',
      Key: ctx.params.key
    }).promise();

    ctx.body = {
      contentType: result.ContentType,
      lastModified: result.LastModified,
      size: result.ContentLength,
      etag: result.ETag
    };
  } catch (error) {
    ctx.status = 404;
    ctx.body = { error: 'File not found' };
  }
});

// Delete file
router.delete('/:key', async (ctx) => {
  try {
    const result = await s3Mock.deleteObject({
      Bucket: 'mock-bucket',
      Key: ctx.params.key
    }).promise();

    ctx.status = 200;
    ctx.body = {
      deleted: true,
      key: ctx.params.key
    };
  } catch (error) {
    ctx.status = 404;
    ctx.body = { error: 'File not found' };
  }
});

// List uploads
router.get('/', async (ctx) => {
  const { prefix = '' } = ctx.query;

  const result = await s3Mock.listObjects({
    Bucket: 'mock-bucket',
    Prefix: prefix
  }).promise();

  ctx.body = {
    files: result.Contents.map(item => ({
      key: item.Key,
      size: item.Size,
      lastModified: item.LastModified,
      etag: item.ETag
    }))
  };
});

export default router;