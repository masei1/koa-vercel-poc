/**
 * MongoDB mock implementation using in-memory storage
 */
class MongoMock {
  constructor() {
    this.collections = new Map();
    this.connected = false;
  }

  // Mock connection method
  async connect(uri) {
    console.log(`[MongoDB Mock] Connecting to ${uri}`);
    this.connected = true;
    return this;
  }

  // Create a collection if it doesn't exist
  collection(name) {
    if (!this.collections.has(name)) {
      this.collections.set(name, new Map());
    }
    return {
      find: (query) => this._find(name, query),
      findOne: (query) => this._findOne(name, query),
      findById: (id) => this._findById(name, id),
      create: (doc) => this._create(name, doc),
      updateOne: (query, update) => this._updateOne(name, query, update),
      deleteOne: (query) => this._deleteOne(name, query)
    };
  }

  // Internal methods
  _find(collectionName, query) {
    const collection = this.collections.get(collectionName);
    let results = Array.from(collection.values());
    
    if (query) {
      results = results.filter(doc => 
        Object.entries(query).every(([key, value]) => doc[key] === value)
      );
    }
    
    return {
      exec: async () => results
    };
  }

  _findOne(collectionName, query) {
    const collection = this.collections.get(collectionName);
    const result = Array.from(collection.values()).find(doc =>
      Object.entries(query).every(([key, value]) => doc[key] === value)
    );
    
    return {
      exec: async () => result || null
    };
  }

  _findById(collectionName, id) {
    const collection = this.collections.get(collectionName);
    return {
      exec: async () => collection.get(id) || null
    };
  }

  _create(collectionName, doc) {
    const collection = this.collections.get(collectionName);
    const id = Math.random().toString(36).substr(2, 9);
    const newDoc = { _id: id, ...doc, createdAt: new Date(), updatedAt: new Date() };
    collection.set(id, newDoc);
    return {
      exec: async () => newDoc
    };
  }

  _updateOne(collectionName, query, update) {
    const collection = this.collections.get(collectionName);
    const doc = Array.from(collection.values()).find(doc =>
      Object.entries(query).every(([key, value]) => doc[key] === value)
    );

    if (doc) {
      const updatedDoc = { ...doc, ...update.$set, updatedAt: new Date() };
      collection.set(doc._id, updatedDoc);
      return {
        exec: async () => ({ modifiedCount: 1, updatedDoc })
      };
    }

    return {
      exec: async () => ({ modifiedCount: 0 })
    };
  }

  _deleteOne(collectionName, query) {
    const collection = this.collections.get(collectionName);
    const doc = Array.from(collection.values()).find(doc =>
      Object.entries(query).every(([key, value]) => doc[key] === value)
    );

    if (doc) {
      collection.delete(doc._id);
      return {
        exec: async () => ({ deletedCount: 1 })
      };
    }

    return {
      exec: async () => ({ deletedCount: 0 })
    };
  }
}

export default new MongoMock();