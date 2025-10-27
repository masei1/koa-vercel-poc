/**
 * Redis mock implementation using Map for in-memory storage
 */
class RedisMock {
  constructor() {
    this.store = new Map();
    this.connected = false;
  }

  async connect() {
    console.log('[Redis Mock] Connecting to mock Redis server');
    this.connected = true;
    return this;
  }

  async get(key) {
    console.log(`[Redis Mock] GET ${key}`);
    const value = this.store.get(key);
    return value ? JSON.parse(value) : null;
  }

  async set(key, value, options = {}) {
    console.log(`[Redis Mock] SET ${key}`);
    this.store.set(key, JSON.stringify(value));
    
    if (options.EX) {
      setTimeout(() => {
        this.store.delete(key);
      }, options.EX * 1000);
    }
    
    return 'OK';
  }

  async del(key) {
    console.log(`[Redis Mock] DEL ${key}`);
    return this.store.delete(key) ? 1 : 0;
  }

  async ping() {
    return 'PONG';
  }

  async keys(pattern) {
    const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
    return Array.from(this.store.keys()).filter(key => regex.test(key));
  }

  async quit() {
    console.log('[Redis Mock] Disconnecting from mock Redis server');
    this.connected = false;
    return 'OK';
  }
}

export default new RedisMock();