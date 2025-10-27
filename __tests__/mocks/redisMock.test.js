import redisMock from '../../mocks/redisMock.js';

describe('Redis Mock', () => {
  beforeEach(async () => {
    await redisMock.connect();
  });

  describe('Connection', () => {
    it('should connect successfully', () => {
      expect(redisMock.connected).toBe(true);
    });

    it('should respond to ping', async () => {
      const response = await redisMock.ping();
      expect(response).toBe('PONG');
    });
  });

  describe('Key Operations', () => {
    beforeEach(async () => {
      // Clear any existing data
      const keys = await redisMock.keys('*');
      for (const key of keys) {
        await redisMock.del(key);
      }
    });

    it('should set and get a value', async () => {
      const key = 'test-key';
      const value = { name: 'Test Value' };

      await redisMock.set(key, value);
      const retrieved = await redisMock.get(key);

      expect(retrieved).toEqual(value);
    });

    it('should handle non-existent keys', async () => {
      const value = await redisMock.get('non-existent');
      expect(value).toBeNull();
    });

    it('should delete a key', async () => {
      const key = 'test-key';
      const value = 'test-value';

      await redisMock.set(key, value);
      const deleteResult = await redisMock.del(key);
      const retrieved = await redisMock.get(key);

      expect(deleteResult).toBe(1);
      expect(retrieved).toBeNull();
    });

    it('should handle key expiration', async () => {
      const key = 'expiring-key';
      const value = 'expiring-value';

      await redisMock.set(key, value, { EX: 1 });
      
      // Value should exist immediately
      let retrieved = await redisMock.get(key);
      expect(retrieved).toBe(value);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Value should be gone
      retrieved = await redisMock.get(key);
      expect(retrieved).toBeNull();
    });

    it('should list keys matching pattern', async () => {
      await redisMock.set('test:1', 'value1');
      await redisMock.set('test:2', 'value2');
      await redisMock.set('other:1', 'value3');

      const testKeys = await redisMock.keys('test:*');
      expect(testKeys).toHaveLength(2);
      expect(testKeys).toContain('test:1');
      expect(testKeys).toContain('test:2');
    });
  });

  describe('Disconnect', () => {
    it('should disconnect successfully', async () => {
      const result = await redisMock.quit();
      expect(result).toBe('OK');
      expect(redisMock.connected).toBe(false);
    });
  });
});