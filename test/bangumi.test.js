const { describe, it } = require('node:test');
const assert = require('node:assert');
const { searchBangumi } = require('../src/bangumi');

function mockFetch(searchBody, relationsBodies) {
  let callIndex = 0;
  return async (_url) => {
    if (callIndex === 0) {
      callIndex++;
      return { json: async () => searchBody, ok: true };
    }
    const rel = relationsBodies[callIndex - 1];
    callIndex++;
    return { json: async () => rel, ok: rel ? true : false };
  };
}

describe('searchBangumi', () => {
  it('maps anime subjects to music relations (gameToMusic)', async () => {
    const searchBody = {
      list: [{ id: 1, name: 'Anime One' }],
    };
    const relationsBody = [{ type: 3, relation: 'OP', name: 'Opening Song' }];
    const results = await searchBangumi('anime', 'gameToMusic', mockFetch(searchBody, [relationsBody]));
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].workName, 'Anime One');
    assert.strictEqual(results[0].category, 'OP');
    assert.strictEqual(results[0].musicName, 'Opening Song');
  });

  it('maps music subjects to anime relations (musicToGame)', async () => {
    const searchBody = {
      list: [{ id: 1, name: 'Opening Song' }],
    };
    const relationsBody = [{ type: 2, relation: 'OP', name: 'Anime One' }];
    const results = await searchBangumi('song', 'musicToGame', mockFetch(searchBody, [relationsBody]));
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].musicName, 'Opening Song');
    assert.strictEqual(results[0].workName, 'Anime One');
  });

  it('deduplicates results by workName|category|musicName', async () => {
    const searchBody = {
      list: [{ id: 1, name: 'Anime A' }],
    };
    const relationsBody = [
      { type: 3, relation: 'OP', name: 'Song X' },
      { type: 3, relation: 'OP', name: 'Song X' },
    ];
    const results = await searchBangumi('anime', 'gameToMusic', mockFetch(searchBody, [relationsBody]));
    assert.strictEqual(results.length, 1);
  });

  it('skips failed relation fetches gracefully', async () => {
    const searchBody = {
      list: [{ id: 1, name: 'Anime One' }],
    };
    const badFetch = async (url) => {
      if (url.includes('search')) {
        return { json: async () => searchBody, ok: true };
      }
      return { json: async () => null, ok: false };
    };
    const results = await searchBangumi('anime', 'gameToMusic', badFetch);
    assert.strictEqual(results.length, 0);
  });

  it('returns empty array when search has no results', async () => {
    const searchBody = { list: [] };
    const results = await searchBangumi('zzz', 'gameToMusic', mockFetch(searchBody, []));
    assert.strictEqual(results.length, 0);
  });
});
