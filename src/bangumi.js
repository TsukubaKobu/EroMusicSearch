const { BANGUMI_BASE, BANGUMI_UA, MODES, MAX_WORKS, fetchWithTimeout } = require('./constants');

async function searchBangumi(term, mode) {
  const isAnimeMode = mode === MODES.GAME_TO_MUSIC;
  const type = isAnimeMode ? '2' : '3';

  const searchRes = await fetchWithTimeout(`${BANGUMI_BASE}search/subject/${encodeURIComponent(term)}?type=${type}`, {
    headers: { 'User-Agent': BANGUMI_UA }
  });
  const searchData = await searchRes.json();

  if (!searchData.list || searchData.list.length === 0) return [];

  const limit = Math.min(searchData.list.length, MAX_WORKS);
  const results = [];

  for (let i = 0; i < limit; i++) {
    const subject = searchData.list[i];

    const relRes = await fetchWithTimeout(`${BANGUMI_BASE}v0/subjects/${subject.id}/subjects`, {
      headers: { 'User-Agent': BANGUMI_UA }
    });

    if (!relRes.ok) continue;
    const relations = await relRes.json();

    relations.forEach(rel => {
      if (isAnimeMode) {
        if (rel.type === 3) {
          results.push({
            workName: subject.name || subject.name_cn,
            category: rel.relation,
            musicName: rel.name || rel.name_cn
          });
        }
      } else {
        if (rel.type === 2 || rel.type === 4) {
          results.push({
            musicName: subject.name || subject.name_cn,
            category: rel.relation,
            workName: rel.name || rel.name_cn
          });
        }
      }
    });
  }

  const uniqueResults = [];
  const seen = new Set();
  results.forEach(r => {
    const key = `${r.workName}|${r.category}|${r.musicName}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueResults.push(r);
    }
  });

  return uniqueResults;
}

module.exports = { searchBangumi };
