/**
 * S3 mock implementation simulating file uploads
 */
class S3Mock {
  constructor() {
    this.buckets = new Map();
    this.baseUrl = 'https://mock-s3.example.com';
  }

  upload(params) {
    const { Bucket, Key, Body, ContentType } = params;
    
    if (!this.buckets.has(Bucket)) {
      this.buckets.set(Bucket, new Map());
    }

    const bucket = this.buckets.get(Bucket);
    const metadata = {
      key: Key,
      size: Body.length,
      contentType: ContentType,
      lastModified: new Date(),
      etag: `"${Math.random().toString(36).substr(2, 9)}"`,
      url: `${this.baseUrl}/${Bucket}/${Key}`
    };

    bucket.set(Key, metadata);

    return {
      promise: () => Promise.resolve({
        Location: metadata.url,
        Key,
        Bucket,
        ETag: metadata.etag
      })
    };
  }

  getObject(params) {
    const { Bucket, Key } = params;
    const bucket = this.buckets.get(Bucket);
    
    if (!bucket || !bucket.has(Key)) {
      return {
        promise: () => Promise.reject(new Error('NoSuchKey: The specified key does not exist.'))
      };
    }

    const metadata = bucket.get(Key);

    return {
      promise: () => Promise.resolve({
        Body: Buffer.from('Mock file content'),
        ContentType: metadata.contentType,
        LastModified: metadata.lastModified,
        ContentLength: metadata.size,
        ETag: metadata.etag
      })
    };
  }

  deleteObject(params) {
    const { Bucket, Key } = params;
    const bucket = this.buckets.get(Bucket);
    
    if (bucket) {
      bucket.delete(Key);
    }

    return {
      promise: () => Promise.resolve({
        DeleteMarker: true,
        VersionId: Math.random().toString(36).substr(2, 9)
      })
    };
  }

  listObjects(params) {
    const { Bucket, Prefix = '' } = params;
    const bucket = this.buckets.get(Bucket) || new Map();
    
    const contents = Array.from(bucket.entries())
      .filter(([key]) => key.startsWith(Prefix))
      .map(([key, metadata]) => ({
        Key: key,
        LastModified: metadata.lastModified,
        ETag: metadata.etag,
        Size: metadata.size,
        StorageClass: 'STANDARD'
      }));

    return {
      promise: () => Promise.resolve({
        Contents: contents,
        IsTruncated: false,
        Name: Bucket,
        Prefix,
        MaxKeys: 1000,
        CommonPrefixes: []
      })
    };
  }
}

export default new S3Mock();