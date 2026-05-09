const sourceSelect = document.getElementById('sourceSelect');
const directionSelect = document.getElementById('directionSelect');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const mirrorCheck = document.getElementById('mirrorCheck');
const mirrorLabel = mirrorCheck.closest('.mirror-label');
const statusBar = document.getElementById('statusBar');
const resultsTable = document.getElementById('resultsTable');
const tableHeaderRow = document.getElementById('tableHeaderRow');
const tableBody = document.getElementById('tableBody');
const settingsBtn = document.getElementById('settingsBtn');
const settingsMenu = document.getElementById('settingsMenu');
const settingsSource = document.getElementById('settingsSource');
const settingsMode = document.getElementById('settingsMode');
const settingsMirror = document.getElementById('settingsMirror');
const clearCacheBtn = document.getElementById('clearCacheBtn');

let sortColumn = null;
let sortAsc = true;
const columnWidths = {};

function getCurrentSource() {
  return sourceSelect.value;
}

function getCurrentMode() {
  return directionSelect.value;
}

function updateMirrorVisibility() {
  mirrorLabel.classList.toggle('hidden', getCurrentSource() !== 'erogamescape');
}

sourceSelect.addEventListener('change', () => {
  hideResults();
  updateMirrorVisibility();
  searchInput.focus();
  settingsSource.value = getCurrentSource();
  onSettingChange();
});

directionSelect.addEventListener('change', () => {
  hideResults();
  searchInput.focus();
  settingsMode.value = getCurrentMode();
  onSettingChange();
});

updateMirrorVisibility();

function makeItemKey(source, workName, category, musicName) {
  return `@|${source}|${workName}|${category}|${musicName}`;
}

function makeSearchKey(source, mode, term, mirrorMode) {
  return `!|${source}|${mode}|${term}|${mirrorMode}`;
}

function showStatus(text, color) {
  statusBar.textContent = text;
  statusBar.style.color = color || 'var(--muted)';
  statusBar.classList.remove('hidden');
}

function hideStatus() {
  statusBar.classList.add('hidden');
  statusBar.textContent = '';
}

const performSearch = async () => {
  const term = searchInput.value.trim();
  if (!term) {
    hideResults();
    showStatus('検索キーワードを入力してください。');
    return;
  }

  hideResults();
  hideStatus();
  showStatus('検索中...');
  searchBtn.disabled = true;

  const source = getCurrentSource();
  const mode = getCurrentMode();
  const mirrorMode = mirrorCheck.checked;

  let cacheShown = false;

  // Check cache first (item-level cache via search index)
  try {
    const cache = await window.api.getCache();
    const searchKey = makeSearchKey(source, mode, term, mirrorMode);
    const searchEntry = cache[searchKey];
    if (searchEntry && searchEntry.results && searchEntry.results.itemKeys) {
      const cachedResults = searchEntry.results.itemKeys
        .map((k) => cache[k]?.results)
        .filter(Boolean);
      if (cachedResults.length > 0) {
        renderTable(cachedResults);
        showStatus('キャッシュから表示（更新中...）', 'var(--accent)');
        cacheShown = true;
      }
    }
  } catch {
    // Cache read failure is non-critical
  }

  // Network search
  try {
    const results = await window.api.searchDatabase({ source, mode, term, mirrorMode });

    // Save each result as an individual cache entry + save search index
    if (results && results.length > 0) {
      try {
        const cache = await window.api.getCache();
        const searchKey = makeSearchKey(source, mode, term, mirrorMode);
        const itemKeys = [];
        for (const item of results) {
          const itemKey = makeItemKey(source, item.workName, item.category, item.musicName);
          itemKeys.push(itemKey);
          if (!cache[itemKey]) {
            cache[itemKey] = { results: { workName: item.workName, category: item.category, musicName: item.musicName }, cachedAt: Date.now() };
          }
        }
        cache[searchKey] = { results: { itemKeys }, cachedAt: Date.now() };
        await window.api.saveCache(cache);
      } catch {
        // Cache write failure is non-critical
      }
    }

    if (results && results.length > 0) {
      hideStatus();
      renderTable(results);
      cacheShown = false;
    } else if (!cacheShown) {
      showStatus('見つかりませんでした。');
    }
  } catch (error) {
    if (!cacheShown) {
      showStatus(`エラー: ${error.message || error}`, '#ff6b6b');
    } else {
      showStatus('キャッシュから表示（オフライン）', 'var(--accent)');
    }
  } finally {
    searchBtn.disabled = false;
  }
};

searchBtn.addEventListener('click', performSearch);
searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') performSearch();
});

function hideResults() {
  resultsTable.classList.add('hidden');
  tableHeaderRow.innerHTML = '';
  tableBody.innerHTML = '';
}

function renderTable(data) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);

  // Apply fixed layout if columns were resized
  if (Object.keys(columnWidths).length > 0) {
    resultsTable.style.tableLayout = 'fixed';
  } else {
    resultsTable.style.tableLayout = '';
  }

  tableHeaderRow.innerHTML = '';
  headers.forEach((h) => {
    const th = document.createElement('th');
    if (h === 'workName') th.textContent = '作品';
    else if (h === 'category') th.textContent = '分類';
    else if (h === 'musicName') th.textContent = '楽曲';
    else th.textContent = h;

    if (columnWidths[h]) {
      th.style.width = columnWidths[h] + 'px';
      th.style.minWidth = columnWidths[h] + 'px';
    }

    th.addEventListener('click', () => {
      if (sortColumn === h) {
        sortAsc = !sortAsc;
      } else {
        sortColumn = h;
        sortAsc = true;
      }
      renderTable(data);
    });

    // Resize handle
    const handle = document.createElement('div');
    handle.className = 'resize-handle';
    handle.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      e.preventDefault();

      // Switch to fixed layout and snapshot all column widths
      if (resultsTable.style.tableLayout !== 'fixed') {
        const allThs = tableHeaderRow.querySelectorAll('th');
        allThs.forEach((t) => {
          const w = t.offsetWidth;
          t.style.width = w + 'px';
          t.style.minWidth = w + 'px';
        });
        resultsTable.style.tableLayout = 'fixed';
      }

      const startX = e.clientX;
      const startWidth = th.offsetWidth;

      const onMove = (ev) => {
        const newWidth = Math.max(40, startWidth + (ev.clientX - startX));
        th.style.width = newWidth + 'px';
        th.style.minWidth = newWidth + 'px';
      };

      const onUp = () => {
        columnWidths[h] = parseInt(th.style.width) || th.offsetWidth;
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };

      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
    th.appendChild(handle);

    if (sortColumn === h) {
      th.classList.add(sortAsc ? 'sort-asc' : 'sort-desc');
    }

    tableHeaderRow.appendChild(th);
  });

  if (sortColumn) {
    data = [...data].sort((a, b) => {
      const va = (a[sortColumn] || '').toString();
      const vb = (b[sortColumn] || '').toString();
      const cmp = va.localeCompare(vb, 'ja');
      return sortAsc ? cmp : -cmp;
    });
  }

  tableBody.innerHTML = '';
  data.forEach((row) => {
    const tr = document.createElement('tr');
    headers.forEach((h) => {
      const td = document.createElement('td');
      td.textContent = row[h];
      td.title = 'クリックでコピー';
      td.addEventListener('click', () => {
        navigator.clipboard.writeText(td.textContent).then(() => {
          td.classList.add('copied');
          setTimeout(() => td.classList.remove('copied'), 500);
        });
      });
      tr.appendChild(td);
    });
    tableBody.appendChild(tr);
  });

  resultsTable.classList.remove('hidden');
}

// --- Settings menu ---

settingsBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  settingsMenu.classList.toggle('hidden');
});

document.addEventListener('click', () => {
  settingsMenu.classList.add('hidden');
});

settingsMenu.addEventListener('click', (e) => {
  e.stopPropagation();
});

function applySettings(s) {
  if (s.defaultSource) {
    sourceSelect.value = s.defaultSource;
    updateMirrorVisibility();
  }
  if (s.defaultMode) {
    directionSelect.value = s.defaultMode;
  }
  if (s.defaultMirror !== undefined) {
    mirrorCheck.checked = s.defaultMirror;
  }

  settingsSource.value = getCurrentSource();
  settingsMode.value = getCurrentMode();
  settingsMirror.checked = mirrorCheck.checked;
}

function onSettingChange() {
  window.api.saveSettings({
    defaultSource: settingsSource.value,
    defaultMode: settingsMode.value,
    defaultMirror: settingsMirror.checked,
  });
}

settingsSource.addEventListener('change', onSettingChange);
settingsMode.addEventListener('change', onSettingChange);
settingsMirror.addEventListener('change', onSettingChange);

clearCacheBtn.addEventListener('click', async () => {
  await window.api.clearCache();
  updateClearCacheLabel();
});

async function updateClearCacheLabel() {
  try {
    const cache = await window.api.getCache();
    const count = Object.keys(cache).length;
    clearCacheBtn.textContent = `🗑 キャッシュを削除 (${count}件)`;
  } catch {
    clearCacheBtn.textContent = '🗑 キャッシュを削除';
  }
}

window.api.getSettings().then((s) => {
  applySettings(s || {});
  updateClearCacheLabel();
});
