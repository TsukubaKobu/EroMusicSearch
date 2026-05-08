const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

const testDir = path.join(os.tmpdir(), `eromusicsearch-cache-test-${Date.now()}`);
const cacheFile = path.join(testDir, 'search-cache.json');

function loadCache() {
  try {
    if (fs.existsSync(cacheFile)) {
      return JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
    }
  } catch {
    return {};
  }
  return {};
}

function saveCache(cache) {
  fs.writeFileSync(cacheFile, JSON.stringify(cache));
}

function clearCache() {
  const empty = {};
  saveCache(empty);
  return Object.keys(empty).length;
}

function setCache(key, results) {
  const cache = loadCache();
  cache[key] = { results, cachedAt: Date.now() };
  saveCache(cache);
}

describe('cache operations', () => {
  beforeEach(() => {
    if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true });
    if (fs.existsSync(cacheFile)) fs.unlinkSync(cacheFile);
  });

  afterEach(() => {
    try {
      if (fs.existsSync(cacheFile)) fs.unlinkSync(cacheFile);
      if (fs.existsSync(testDir)) fs.rmdirSync(testDir);
    } catch {
      // cleanup failure is fine
    }
  });

  it('returns empty object when no cache file exists', () => {
    const cache = loadCache();
    assert.deepStrictEqual(cache, {});
  });

  it('saves and loads cache entries', () => {
    const results = [{ workName: 'Test', category: 'OP', musicName: 'Song' }];
    setCache('egs|gameToMusic|test|false', results);

    const cache = loadCache();
    assert.strictEqual(Object.keys(cache).length, 1);
    assert.deepStrictEqual(cache['egs|gameToMusic|test|false'].results, results);
    assert.ok(typeof cache['egs|gameToMusic|test|false'].cachedAt === 'number');
  });

  it('stores multiple cache entries independently', () => {
    setCache('key1', [{ a: 1 }]);
    setCache('key2', [{ b: 2 }]);
    setCache('key3', [{ c: 3 }]);

    const cache = loadCache();
    assert.strictEqual(Object.keys(cache).length, 3);
  });

  it('overwrites existing cache entry', () => {
    setCache('key1', [{ old: true }]);
    setCache('key1', [{ new: true }]);

    const cache = loadCache();
    assert.strictEqual(Object.keys(cache).length, 1);
    assert.deepStrictEqual(cache['key1'].results, [{ new: true }]);
  });

  it('clears all cache entries', () => {
    setCache('key1', [{ a: 1 }]);
    setCache('key2', [{ b: 2 }]);

    const count = clearCache();
    assert.strictEqual(count, 0);

    const cache = loadCache();
    assert.deepStrictEqual(cache, {});
  });

  it('handles cache key with special characters', () => {
    const key = 'anison|musicToGame|オープニング|false';
    setCache(key, [{ musicName: 'Opening' }]);

    const cache = loadCache();
    assert.strictEqual(Object.keys(cache).length, 1);
    assert.deepStrictEqual(cache[key].results, [{ musicName: 'Opening' }]);
  });
});
