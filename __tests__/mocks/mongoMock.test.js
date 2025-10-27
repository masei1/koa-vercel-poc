import mongoMock from '../../mocks/mongoMock.js';

describe('MongoDB Mock', () => {
  beforeEach(async () => {
    await mongoMock.connect('mongodb://mock:27017/test');
  });

  describe('Connection', () => {
    it('should connect successfully', () => {
      expect(mongoMock.connected).toBe(true);
    });
  });

  describe('CRUD Operations', () => {
    const testCollection = 'users';
    const testUser = {
      name: 'Test User',
      email: 'test@example.com'
    };

    it('should create a document', async () => {
      const result = await mongoMock.collection(testCollection)
        .create(testUser)
        .exec();

      expect(result).toHaveProperty('_id');
      expect(result.name).toBe(testUser.name);
      expect(result.email).toBe(testUser.email);
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('updatedAt');
    });

    it('should find documents', async () => {
      // Create test document
      const created = await mongoMock.collection(testCollection)
        .create(testUser)
        .exec();

      // Find all documents
      const allDocs = await mongoMock.collection(testCollection)
        .find()
        .exec();
      expect(allDocs).toHaveLength(1);

      // Find by query
      const foundDocs = await mongoMock.collection(testCollection)
        .find({ name: testUser.name })
        .exec();
      expect(foundDocs).toHaveLength(1);
      expect(foundDocs[0]).toEqual(created);
    });

    it('should find document by ID', async () => {
      const created = await mongoMock.collection(testCollection)
        .create(testUser)
        .exec();

      const found = await mongoMock.collection(testCollection)
        .findById(created._id)
        .exec();

      expect(found).toEqual(created);
    });

    it('should update document', async () => {
      const created = await mongoMock.collection(testCollection)
        .create(testUser)
        .exec();

      const updateResult = await mongoMock.collection(testCollection)
        .updateOne(
          { _id: created._id },
          { $set: { name: 'Updated Name' } }
        )
        .exec();

      expect(updateResult.modifiedCount).toBe(1);

      const updated = await mongoMock.collection(testCollection)
        .findById(created._id)
        .exec();
      expect(updated.name).toBe('Updated Name');
    });

    it('should delete document', async () => {
      const created = await mongoMock.collection(testCollection)
        .create(testUser)
        .exec();

      const deleteResult = await mongoMock.collection(testCollection)
        .deleteOne({ _id: created._id })
        .exec();

      expect(deleteResult.deletedCount).toBe(1);

      const found = await mongoMock.collection(testCollection)
        .findById(created._id)
        .exec();
      expect(found).toBeNull();
    });
  });
});