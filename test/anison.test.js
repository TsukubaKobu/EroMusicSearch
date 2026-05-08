const { describe, it } = require('node:test');
const assert = require('node:assert');
const { searchAnison } = require('../src/anison');

function mockFetch(searchHtml, detailHtmls = []) {
  let callIndex = 0;
  return async () => {
    if (callIndex === 0) {
      callIndex++;
      return { text: async () => searchHtml };
    }
    const html = detailHtmls[callIndex - 1];
    callIndex++;
    return { text: async () => html };
  };
}

describe('searchAnison', () => {
  it('parses program detail pages (gameToMusic mode)', async () => {
    const searchHtml = '<a href="javascript:link(\'program\',\'123\')">Program A</a>';
    const detailHtml = '<table><tr><td>OP</td><td>Opening Song</td></tr></table>';
    const results = await searchAnison('program', 'gameToMusic', mockFetch(searchHtml, [detailHtml]));
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].workName, 'Program A');
    assert.strictEqual(results[0].category, 'OP');
    assert.strictEqual(results[0].musicName, 'Opening Song');
  });

  it('filters non-music category rows in detail pages', async () => {
    const searchHtml = '<a href="javascript:link(\'program\',\'123\')">Program B</a>';
    const detailHtml =
      '<table><tr><td>Staff</td><td>Name</td></tr><tr><td>OP</td><td>Song</td></tr></table>';
    const results = await searchAnison('program', 'gameToMusic', mockFetch(searchHtml, [detailHtml]));
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].category, 'OP');
  });

  it('parses song search results (musicToGame mode)', async () => {
    const searchHtml = `<table class="list"><tbody>
      <tr><td>Song Name</td><td>Artist</td><td>Genre</td><td>Work Name</td><td>OP</td></tr>
    </tbody></table>`;
    const results = await searchAnison('song', 'musicToGame', mockFetch(searchHtml));
    assert.strictEqual(results.length, 1);
    assert.ok(results[0].musicName.includes('Song Name'));
    assert.ok(results[0].musicName.includes('Artist'));
    assert.ok(results[0].category.includes('Genre'));
    assert.ok(results[0].category.includes('OP'));
    assert.strictEqual(results[0].workName, 'Work Name');
  });

  it('skips rows with fewer than 5 columns in song search', async () => {
    const searchHtml = `<table class="list"><tbody>
      <tr><td>Too</td><td>Few</td><td>Cols</td></tr>
      <tr><td>S1</td><td>A1</td><td>G1</td><td>W1</td><td>OP</td></tr>
    </tbody></table>`;
    const results = await searchAnison('song', 'musicToGame', mockFetch(searchHtml));
    assert.strictEqual(results.length, 1);
  });

  it('returns empty array when no program links found', async () => {
    const searchHtml = '<html><body>No programs</body></html>';
    const results = await searchAnison('program', 'gameToMusic', mockFetch(searchHtml));
    assert.strictEqual(results.length, 0);
  });
});
