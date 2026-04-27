const cheerio = require('cheerio');
const { EGS_URLS, RETRY_DELAY_MS, MODES, toKatakana, toHiragana, escapeLike, fetchWithTimeout } = require('./constants');

async function searchErogameScape(term, mode, mirrorMode) {
  const rawTerm = escapeLike(term.trim());

  const hiraTerm = toHiragana(rawTerm);
  const kataTerm = toKatakana(rawTerm);

  const terms = Array.from(new Set([rawTerm, hiraTerm, kataTerm]));

  const gameConds = terms.map(t => `g.gamename ILIKE '%${t}%' OR g.furigana ILIKE '%${t}%'`).join(' OR ');
  const musicConds = terms.map(t => `m.name ILIKE '%${t}%' OR m.furigana ILIKE '%${t}%'`).join(' OR ');

  let sql = '';

  if (mode === MODES.GAME_TO_MUSIC) {
    sql = `
SELECT g.gamename AS "workName", gm.category, m.name AS "musicName"
FROM gamelist g 
JOIN game_music gm ON g.id = gm.game 
JOIN musiclist m ON gm.music = m.id 
WHERE (${gameConds})
ORDER BY g.gamename, gm.category;
    `.trim();
  } else {
    sql = `
SELECT m.name AS "musicName", gm.category, g.gamename AS "workName"
FROM musiclist m 
JOIN game_music gm ON m.id = gm.music 
JOIN gamelist g ON gm.game = g.id 
WHERE (${musicConds})
ORDER BY m.name, gm.category;
    `.trim();
  }

  const egsUrl = mirrorMode ? EGS_URLS.mirror : EGS_URLS.primary;

  const runEgsQuery = async () => {
    const response = await fetchWithTimeout(egsUrl, { method: 'POST', body: new URLSearchParams({ sql }) });
    const rawData = await response.text();
    const $ = cheerio.load(rawData);
    const rows = [];
    const headers = [];
    $('table#result th').each((i, el) => headers.push($(el).text().trim()));

    if (headers.length === 0) {
      const anyTable = $('table').first();
      if (anyTable.length > 0) {
        anyTable.find('th').each((i, el) => headers.push($(el).text().trim()));
        anyTable.find('tr').each((i, el) => {
          if (i === 0 && $(el).find('th').length > 0) return;
          const row = {};
          $(el).find('td').each((j, td) => { row[headers[j] || `col${j}`] = $(td).text().trim(); });
          if (Object.keys(row).length > 0) rows.push(row);
        });
      }
    } else {
      $('table#result tr').each((i, el) => {
        if ($(el).find('th').length > 0) return;
        const row = {};
        $(el).find('td').each((j, td) => { row[headers[j] || `col${j}`] = $(td).text().trim(); });
        if (Object.keys(row).length > 0) rows.push(row);
      });
    }
    return rows;
  };

  let results = await runEgsQuery();
  if (results.length === 0) {
    await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
    results = await runEgsQuery();
  }
  return results;
}

module.exports = { searchErogameScape };
