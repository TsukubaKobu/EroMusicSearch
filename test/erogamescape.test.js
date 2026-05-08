const { describe, it } = require('node:test');
const assert = require('node:assert');
const { searchErogameScape } = require('../src/erogamescape');

function mockFetch(html) {
  return async () => ({ text: async () => html });
}

describe('searchErogameScape', () => {
  it('parses rows from #result table (gameToMusic mode)', async () => {
    const html = `<table id="result">
      <tr><th>workName</th><th>category</th><th>musicName</th></tr>
      <tr><td>Nekopara</td><td>OP</td><td>Taiyou Paradise</td></tr>
    </table>`;
    const results = await searchErogameScape('nekopara', 'gameToMusic', false, mockFetch(html));
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].workName, 'Nekopara');
    assert.strictEqual(results[0].category, 'OP');
    assert.strictEqual(results[0].musicName, 'Taiyou Paradise');
  });

  it('parses rows from #result table (musicToGame mode)', async () => {
    const html = `<table id="result">
      <tr><th>musicName</th><th>category</th><th>workName</th></tr>
      <tr><td>Taiyou Paradise</td><td>OP</td><td>Nekopara</td></tr>
    </table>`;
    const results = await searchErogameScape('taiyou', 'musicToGame', false, mockFetch(html));
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].musicName, 'Taiyou Paradise');
  });

  it('falls back to first table when #result is missing', async () => {
    const html = `<table>
      <tr><th>workName</th><th>category</th><th>musicName</th></tr>
      <tr><td>Fallback Game</td><td>ED</td><td>Ending Song</td></tr>
    </table>`;
    const results = await searchErogameScape('fallback', 'gameToMusic', false, mockFetch(html));
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].workName, 'Fallback Game');
  });

  it('returns empty array when no table rows found', async () => {
    const html = '<html><body>No results</body></html>';
    const results = await searchErogameScape('nothing', 'gameToMusic', false, mockFetch(html));
    assert.strictEqual(results.length, 0);
  });

  it('uses mirror URL when mirrorMode is true', async () => {
    let capturedUrl = '';
    const capturingFetch = async (url) => {
      capturedUrl = url;
      return { text: async () => '<table id="result"><tr><th>A</th></tr></table>' };
    };
    await searchErogameScape('test', 'gameToMusic', true, capturingFetch);
    assert.ok(capturedUrl.includes('koko.kyara.top'));
  });
});
