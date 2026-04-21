const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const cheerio = require('cheerio');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#0f172a', // Slate 900
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();

  // Pre-warm EGS endpoints to establish session before first user search
  const warmUp = (url) => fetch(url, { method: 'GET' }).catch(() => {});
  warmUp('https://erogamescape.dyndns.org/~ap2/ero/toukei_kaiseki/sql_for_erogamer_form.php');
  warmUp('https://koko.kyara.top/sql_for_erogamer_form.php');

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Convert Hiragana to Katakana
function toKatakana(str) {
  return str.replace(/[\u3041-\u3096]/g, function(match) {
    var chr = match.charCodeAt(0) + 0x60;
    return String.fromCharCode(chr);
  });
}

// Convert Katakana to Hiragana
function toHiragana(str) {
  return str.replace(/[\u30A1-\u30F6]/g, function(match) {
    var chr = match.charCodeAt(0) - 0x60;
    return String.fromCharCode(chr);
  });
}

// IPC Handler for querying databases
ipcMain.handle('search-database', async (event, { source, mode, term, mirrorMode }) => {
  try {
    if (source === 'bangumi') {
      const isAnimeMode = mode === 'gameToMusic';
      const type = isAnimeMode ? '2' : '3'; // 2=Anime, 3=Music

      // 1. Search for the subject
      const searchRes = await fetch(`https://api.bgm.tv/search/subject/${encodeURIComponent(term)}?type=${type}`, {
        headers: { 'User-Agent': 'EroMusicSearch/1.0 (https://github.com/eromusicsearch)' }
      });
      const searchData = await searchRes.json();
      
      if (!searchData.list || searchData.list.length === 0) return [];
      
      // Grab top 3 results to ensure we find good relations
      const limit = Math.min(searchData.list.length, 3);
      const results = [];
      
      for (let i = 0; i < limit; i++) {
        const subject = searchData.list[i];
        
        // 2. Fetch its relations
        const relRes = await fetch(`https://api.bgm.tv/v0/subjects/${subject.id}/subjects`, {
          headers: { 'User-Agent': 'EroMusicSearch/1.0 (https://github.com/eromusicsearch)' }
        });
        
        if (!relRes.ok) continue;
        const relations = await relRes.json();
        
        relations.forEach(rel => {
          if (isAnimeMode) {
            // We want related Music (type 3)
            if (rel.type === 3) {
              results.push({
                workName: subject.name || subject.name_cn,
                category: rel.relation,
                musicName: rel.name || rel.name_cn
              });
            }
          } else {
            // We want related Anime (type 2) or Game (type 4)
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
      
      // Filter out duplicate identical rows
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
    else {
      // ErogameScape Logic
      const safeTerm = term.replace(/'/g, "''").trim();
      const hiraTerm = toHiragana(safeTerm);
      const kataTerm = toKatakana(safeTerm);
      
      const terms = Array.from(new Set([safeTerm, hiraTerm, kataTerm]));
      
      const gameConds = terms.map(t => `g.gamename ILIKE '%${t}%' OR g.furigana ILIKE '%${t}%'`).join(' OR ');
      const musicConds = terms.map(t => `m.name ILIKE '%${t}%' OR m.furigana ILIKE '%${t}%'`).join(' OR ');

      let sql = '';

      if (mode === 'gameToMusic') {
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

      const egsUrl = mirrorMode
          ? 'https://koko.kyara.top/sql_for_erogamer_form.php'
          : 'https://erogamescape.dyndns.org/~ap2/ero/toukei_kaiseki/sql_for_erogamer_form.php';

      const runEgsQuery = async () => {
        const response = await fetch(egsUrl, { method: 'POST', body: new URLSearchParams({ sql }) });
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

      try {
        let results = await runEgsQuery();
        // Auto-retry once on empty (EGS session may not be ready on first launch)
        if (results.length === 0) {
          await new Promise(r => setTimeout(r, 800));
          results = await runEgsQuery();
        }
        return results;
      } catch (e) {
        console.error(e);
        throw new Error(e.message);
      }
    }
  } catch (error) {
    throw error;
  }
});
