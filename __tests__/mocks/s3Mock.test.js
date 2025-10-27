import s3Mock from '../../mocks/s3Mock.js';

describe('S3 Mock', () => {
  const testBucket = 'test-bucket';
  const testKey = 'test-file.txt';
  const testContent = 'Test file content';
  const testContentType = 'text/plain';

  describe('Upload Operations', () => {
    it('should upload a file', async () => {
      const result = await s3Mock.upload({
        Bucket: testBucket,
        Key: testKey,
        Body: testContent,
        ContentType: testContentType
      }).promise();

      expect(result).toHaveProperty('Location');
      expect(result.Location).toContain(testBucket);
      expect(result.Location).toContain(testKey);
      expect(result).toHaveProperty('Key', testKey);
      expect(result).toHaveProperty('Bucket', testBucket);
      expect(result).toHaveProperty('ETag');
    });
  });

  describe('Get Operations', () => {
    beforeEach(async () => {
      await s3Mock.upload({
        Bucket: testBucket,
        Key: testKey,
        Body: testContent,
        ContentType: testContentType
      }).promise();
    });

    it('should get object metadata', async () => {
      const result = await s3Mock.getObject({
        Bucket: testBucket,
        Key: testKey
      }).promise();

      expect(result).toHaveProperty('ContentType', testContentType);
      expect(result).toHaveProperty('Body');
      expect(result).toHaveProperty('LastModified');
      expect(result).toHaveProperty('ContentLength');
      expect(result).toHaveProperty('ETag');
    });

    it('should handle non-existent objects', async () => {
      await expect(s3Mock.getObject({
        Bucket: testBucket,
        Key: 'non-existent.txt'
      }).promise()).rejects.toThrow('NoSuchKey');
    });
  });

  describe('Delete Operations', () => {
    beforeEach(async () => {
      await s3Mock.upload({
        Bucket: testBucket,
        Key: testKey,
        Body: testContent,
        ContentType: testContentType
      }).promise();
    });

    it('should delete an object', async () => {
      const result = await s3Mock.deleteObject({
        Bucket: testBucket,
        Key: testKey
      }).promise();

      expect(result).toHaveProperty('DeleteMarker', true);
      expect(result).toHaveProperty('VersionId');

      // Verify deletion
      await expect(s3Mock.getObject({
        Bucket: testBucket,
        Key: testKey
      }).promise()).rejects.toThrow('NoSuchKey');
    });
  });

  describe('List Operations', () => {
    beforeEach(async () => {
      // Upload multiple test files
      await Promise.all([
        s3Mock.upload({
          Bucket: testBucket,
          Key: 'folder1/file1.txt',
          Body: 'content1',
          ContentType: 'text/plain'
        }).promise(),
        s3Mock.upload({
          Bucket: testBucket,
          Key: 'folder1/file2.txt',
          Body: 'content2',
          ContentType: 'text/plain'
        }).promise(),
        s3Mock.upload({
          Bucket: testBucket,
          Key: 'folder2/file3.txt',
          Body: 'content3',
          ContentType: 'text/plain'
        }).promise()
      ]);
    });

    it('should list objects with prefix', async () => {
      const result = await s3Mock.listObjects({
        Bucket: testBucket,
        Prefix: 'folder1/'
      }).promise();

      expect(result.Contents).toHaveLength(2);
      expect(result.Contents[0]).toHaveProperty('Key');
      expect(result.Contents[0]).toHaveProperty('LastModified');
      expect(result.Contents[0]).toHaveProperty('Size');
      expect(result.Contents[0]).toHaveProperty('ETag');
      expect(result.Contents[0].StorageClass).toBe('STANDARD');
    });
  });
});