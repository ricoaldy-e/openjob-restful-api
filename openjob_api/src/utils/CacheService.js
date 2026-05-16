const Redis = require('ioredis');

class CacheService {
  constructor() {
    this._client = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
    });

    this._client.on('error', (err) => {
      console.error('Redis connection error:', err.message);
    });
  }

  async set(key, value, expirationInSeconds = 3600) {
    await this._client.set(key, value, 'EX', expirationInSeconds);
  }

  async get(key) {
    const result = await this._client.get(key);
    if (result === null) throw new Error('Cache miss');
    return result;
  }

  async delete(key) {
    await this._client.del(key);
  }
}

module.exports = CacheService;
