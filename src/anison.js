const cheerio = require('cheerio');
const { ANISON_BASE, MODES, MAX_WORKS, fetchWithTimeout } = require('./constants');

const UA = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' };

async function searchAnison(term, mode) {
  const isAnimeMode = mode === MODES.GAME_TO_MUSIC;
  const baseUrl = ANISON_BASE;

  if (isAnimeMode) {
    const searchRes = await fetchWithTimeout(
      `${baseUrl}n.php?m=pro&q=${encodeURIComponent(term)}`,
      { headers: UA }
    );
    const searchHtml = await searchRes.text();
    const $ = cheerio.load(searchHtml);

    const programs = [];
    $('a[href*="link(\'program\'"]').each((i, el) => {
      const href = $(el).attr('href') || '';
      const m = href.match(/link\('program','(\d+)'\)/);
      if (m) programs.push({ id: m[1], name: $(el).text().trim() });
    });

    const detailPages = await Promise.all(
      programs.slice(0, MAX_WORKS).map(async (prog) => {
        const detailRes = await fetchWithTimeout(
          `${baseUrl}program/${prog.id}.html`,
          { headers: UA }
        );
        const detailHtml = await detailRes.text();
        return { prog, html: detailHtml };
      })
    );

    const results = [];
    for (const { prog, html } of detailPages) {
      const $d = cheerio.load(html);
      $d('table tr').each((i, el) => {
        const tds = $d(el).find('td');
        if (tds.length < 2) return;
        const category = $d(tds[0]).text().trim();
        const musicName = $d(tds[1]).text().trim();
        if (/^(OP|ED|IN|AR|IM)/.test(category) && musicName) {
          results.push({ workName: prog.name, category, musicName });
        }
      });
    }
    return results;
  }

  const searchRes = await fetchWithTimeout(
    `${baseUrl}n.php?m=song&q=${encodeURIComponent(term)}`,
    { headers: UA }
  );
  const searchHtml = await searchRes.text();
  const $ = cheerio.load(searchHtml);

  const results = [];
  $('table.list tbody tr').each((i, el) => {
    const tds = $(el).find('td');
    if (tds.length < 5) return;
    const musicName = $(tds[0]).text().trim();
    const artist = $(tds[1]).text().trim().replace(/\s+/g, ' ');
    const genre = $(tds[2]).text().trim();
    const workName = $(tds[3]).text().trim();
    const category = $(tds[4]).text().trim();
    if (musicName && workName) {
      results.push({ musicName: `${musicName}（${artist}）`, category: `${category} [${genre}]`, workName });
    }
  });
  return results;
}

module.exports = { searchAnison };
