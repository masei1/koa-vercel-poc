import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand
} from '@aws-sdk/client-s3';

/**
 * S3 mock implementation that mimics the AWS SDK v3 client interface.
 */
class S3Mock {
  constructor() {
    this.buckets = new Map();
    this.baseUrl = 'https://mock-s3.example.com';
  }

  async send(command) {
    const input = command?.input ?? {};

    if (command instanceof PutObjectCommand) {
      return this.#handlePutObject(input);
    }

    if (command instanceof GetObjectCommand) {
      return this.#handleGetObject(input);
    }

    if (command instanceof DeleteObjectCommand) {
      return this.#handleDeleteObject(input);
    }

    if (command instanceof ListObjectsV2Command) {
      return this.#handleListObjectsV2(input);
    }

    throw new Error(`S3Mock does not support command: ${command?.constructor?.name ?? 'UnknownCommand'}`);
  }

  getObjectUrl(bucket, key) {
    return `${this.baseUrl}/${bucket}/${key}`;
  }

  #ensureBucketExists(bucketName) {
    if (!this.buckets.has(bucketName)) {
      this.buckets.set(bucketName, new Map());
    }

    return this.buckets.get(bucketName);
  }

  #handlePutObject(input) {
    const { Bucket, Key, Body = '', ContentType } = input;

    if (!Bucket || !Key) {
      throw new Error('Bucket and Key are required');
    }

    const bucket = this.#ensureBucketExists(Bucket);
    const dataBuffer = Buffer.isBuffer(Body) ? Body : Buffer.from(Body);
    const contentType = ContentType ?? 'application/octet-stream';
    const metadata = {
      key: Key,
      size: dataBuffer.length,
      contentType,
      lastModified: new Date(),
      etag: `"${Math.random().toString(36).slice(2, 11)}"`,
      location: this.getObjectUrl(Bucket, Key),
      body: dataBuffer
    };

    bucket.set(Key, metadata);

    return {
      ETag: metadata.etag,
      Bucket,
      Key,
      Location: metadata.location,
      ContentType: contentType
    };
  }

  #handleGetObject(input) {
    const { Bucket, Key } = input;
    const bucket = this.buckets.get(Bucket);

    if (!bucket || !bucket.has(Key)) {
      throw new Error('NoSuchKey: The specified key does not exist.');
    }

    const metadata = bucket.get(Key);

    return {
      Body: metadata.body,
      ContentType: metadata.contentType,
      LastModified: metadata.lastModified,
      ContentLength: metadata.size,
      ETag: metadata.etag
    };
  }

  #handleDeleteObject(input) {
    const { Bucket, Key } = input;
    const bucket = this.buckets.get(Bucket);

    if (bucket) {
      bucket.delete(Key);
    }

    return {
      DeleteMarker: true,
      VersionId: Math.random().toString(36).slice(2, 11)
    };
  }

  #handleListObjectsV2(input) {
    const { Bucket, Prefix = '' } = input;
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
      Contents: contents,
      IsTruncated: false,
      KeyCount: contents.length,
      MaxKeys: 1000,
      Name: Bucket,
      Prefix: Prefix ?? '',
      CommonPrefixes: []
    };
  }
}

export default new S3Mock();
