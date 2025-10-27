/**
 * OpenSearch mock implementation with realistic search responses
 */
class OpenSearchMock {
  constructor() {
    this.indices = new Map();
    this.connected = false;
  }

  async connect(config) {
    console.log(`[OpenSearch Mock] Connecting to ${config.node}`);
    this.connected = true;
    return this;
  }

  async index({ index, id, body }) {
    if (!this.indices.has(index)) {
      this.indices.set(index, new Map());
    }
    
    const indexMap = this.indices.get(index);
    const docId = id || Math.random().toString(36).substr(2, 9);
    indexMap.set(docId, { ...body, _id: docId });

    return {
      body: {
        _index: index,
        _id: docId,
        _version: 1,
        result: 'created',
        _shards: {
          total: 2,
          successful: 1,
          failed: 0
        },
        _seq_no: Math.floor(Math.random() * 1000),
        _primary_term: 1
      }
    };
  }

  async search({ index, body }) {
    const indexMap = this.indices.get(index) || new Map();
    const documents = Array.from(indexMap.values());
    let results = [...documents];

    if (body.query) {
      if (body.query.match) {
        const [field, value] = Object.entries(body.query.match)[0];
        results = documents.filter(doc => 
          doc[field] && doc[field].toLowerCase().includes(value.toLowerCase())
        );
      } else if (body.query.term) {
        const [field, value] = Object.entries(body.query.term)[0];
        results = documents.filter(doc => {
          const docValue = doc[field];

          if (Array.isArray(docValue)) {
            return docValue.includes(value);
          }

          return docValue === value;
        });
      }
    }

    return {
      body: {
        took: Math.floor(Math.random() * 100),
        timed_out: false,
        _shards: {
          total: 5,
          successful: 5,
          skipped: 0,
          failed: 0
        },
        hits: {
          total: {
            value: results.length,
            relation: "eq"
          },
          max_score: 1.0,
          hits: results.map(doc => ({
            _index: index,
            _id: doc._id,
            _score: 1.0,
            _source: doc
          }))
        }
      }
    };
  }

  async delete({ index, id }) {
    const indexMap = this.indices.get(index);
    if (!indexMap || !indexMap.has(id)) {
      throw new Error(`Document ${id} not found in index ${index}`);
    }

    indexMap.delete(id);
    return {
      body: {
        _index: index,
        _id: id,
        _version: 2,
        result: 'deleted',
        _shards: {
          total: 2,
          successful: 1,
          failed: 0
        },
        _seq_no: Math.floor(Math.random() * 1000),
        _primary_term: 1
      }
    };
  }
}

export default new OpenSearchMock();
