import opensearchMock from '../../mocks/opensearchMock.js';

describe('OpenSearch Mock', () => {
  beforeEach(async () => {
    await opensearchMock.connect({
      node: 'http://mock-opensearch:9200'
    });
  });

  describe('Connection', () => {
    it('should connect successfully', () => {
      expect(opensearchMock.connected).toBe(true);
    });
  });

  describe('Document Operations', () => {
    const testIndex = 'test-index';
    const testDoc = {
      title: 'Test Document',
      content: 'This is a test document for searching',
      tags: ['test', 'document']
    };

    it('should index a document', async () => {
      const result = await opensearchMock.index({
        index: testIndex,
        body: testDoc
      });

      expect(result.body).toHaveProperty('_index', testIndex);
      expect(result.body).toHaveProperty('_id');
      expect(result.body).toHaveProperty('result', 'created');
    });

    it('should search documents with match query', async () => {
      // Index test document
      await opensearchMock.index({
        index: testIndex,
        body: testDoc
      });

      const searchResult = await opensearchMock.search({
        index: testIndex,
        body: {
          query: {
            match: {
              content: 'test'
            }
          }
        }
      });

      expect(searchResult.body.hits.total.value).toBeGreaterThan(0);
      expect(searchResult.body.hits.hits[0]._source).toMatchObject(testDoc);
    });

    it('should search documents with term query', async () => {
      // Index test document
      await opensearchMock.index({
        index: testIndex,
        body: testDoc
      });

      const searchResult = await opensearchMock.search({
        index: testIndex,
        body: {
          query: {
            term: {
              'tags': 'test'
            }
          }
        }
      });

      expect(searchResult.body.hits.total.value).toBeGreaterThan(0);
      expect(searchResult.body.hits.hits[0]._source).toMatchObject(testDoc);
    });

    it('should delete documents', async () => {
      // Index test document
      const indexResult = await opensearchMock.index({
        index: testIndex,
        body: testDoc
      });

      const deleteResult = await opensearchMock.delete({
        index: testIndex,
        id: indexResult.body._id
      });

      expect(deleteResult.body).toHaveProperty('result', 'deleted');

      // Verify deletion
      await expect(opensearchMock.delete({
        index: testIndex,
        id: indexResult.body._id
      })).rejects.toThrow('Document');
    });
  });
});