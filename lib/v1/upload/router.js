import Router from '@koa/router';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand
} from '@aws-sdk/client-s3';
import s3Client from '../../../mocks/s3Mock.js';

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
  const putCommand = new PutObjectCommand({
    Bucket: 'mock-bucket',
    Key: key,
    Body: Buffer.from('Mock file content'),
    ContentType: contentType
  });
  const uploadResult = await s3Client.send(putCommand);
  const location = uploadResult.Location ?? s3Client.getObjectUrl('mock-bucket', key);

  ctx.status = 201;
  ctx.body = {
    url: location,
    key: uploadResult.Key ?? key,
    bucket: uploadResult.Bucket ?? 'mock-bucket'
  };
});

// Get file metadata
router.get('/:key', async (ctx) => {
  try {
    const getCommand = new GetObjectCommand({
      Bucket: 'mock-bucket',
      Key: ctx.params.key
    });
    const result = await s3Client.send(getCommand);

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
    const deleteCommand = new DeleteObjectCommand({
      Bucket: 'mock-bucket',
      Key: ctx.params.key
    });
    await s3Client.send(deleteCommand);

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

  const listCommand = new ListObjectsV2Command({
    Bucket: 'mock-bucket',
    Prefix: prefix
  });
  const result = await s3Client.send(listCommand);

  const contents = result.Contents ?? [];

  ctx.body = {
    files: contents.map(item => ({
      key: item.Key,
      size: item.Size,
      lastModified: item.LastModified,
      etag: item.ETag
    }))
  };
});

export default router;
