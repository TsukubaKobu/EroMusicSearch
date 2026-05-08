const modeSelect = document.getElementById('modeSelect');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const mirrorCheck = document.getElementById('mirrorCheck');
const loader = document.getElementById('loader');
const errorBox = document.getElementById('errorBox');
const resultsTable = document.getElementById('resultsTable');
const noResults = document.getElementById('noResults');
const tableHeaderRow = document.getElementById('tableHeaderRow');
const tableBody = document.getElementById('tableBody');
const cacheIndicator = document.getElementById('cacheIndicator');
const settingsBtn = document.getElementById('settingsBtn');
const settingsMenu = document.getElementById('settingsMenu');
const settingsSource = document.getElementById('settingsSource');
const settingsMode = document.getElementById('settingsMode');
const settingsMirror = document.getElementById('settingsMirror');
const settingsFontSize = document.getElementById('settingsFontSize');
const settingsWindowSize = document.getElementById('settingsWindowSize');
const clearCacheBtn = document.getElementById('clearCacheBtn');

let sortColumn = null;
let sortAsc = true;

// Always read from the actual DOM element to avoid stale state on reload
function getCurrentMode() {
  const [s, m] = modeSelect.value.split('|');
  return { source: s, mode: m };
}

function updateMirrorVisibility() {
  const { source } = getCurrentMode();
  mirrorCheck.closest('.mirror-label').classList.toggle('hidden', source !== 'erogamescape');
}

modeSelect.addEventListener('change', () => {
  hideResults();
  updateMirrorVisibility();
  searchInput.focus();
});

updateMirrorVisibility();

function makeCacheKey(source, mode, term, mirrorMode) {
  return `${source}|${mode}|${term}|${mirrorMode}`;
}

function showCacheIndicator(text) {
  cacheIndicator.textContent = text;
  cacheIndicator.classList.remove('hidden');
}

function hideCacheIndicator() {
  cacheIndicator.classList.add('hidden');
}

const performSearch = async () => {
  const term = searchInput.value.trim();
  if (!term) {
    hideResults();
    errorBox.classList.add('hidden');
    noResults.textContent = '検索キーワードを入力してください。';
    noResults.classList.remove('hidden');
    return;
  }

  hideResults();
  errorBox.classList.add('hidden');
  hideCacheIndicator();
  loader.classList.remove('hidden');
  searchBtn.disabled = true;

  const { source, mode } = getCurrentMode();
  const mirrorMode = mirrorCheck.checked;
  const cacheKey = makeCacheKey(source, mode, term, mirrorMode);

  // Check cache first
  try {
    const cache = await window.api.getCache();
    if (cache[cacheKey]) {
      const cachedResults = cache[cacheKey].results;
      if (cachedResults && cachedResults.length > 0) {
        renderTable(cachedResults);
        showCacheIndicator('キャッシュから表示（更新中...）');
        loader.classList.add('hidden');
      }
    }
  } catch {
    // Cache read failure is non-critical
  }

  // Network search (background if cache was shown)
  try {
    const results = await window.api.searchDatabase({ source, mode, term, mirrorMode });

    // Save to cache
    try {
      await window.api.setCache(cacheKey, results);
    } catch {
      // Cache write failure is non-critical
    }

    if (results && results.length > 0) {
      hideCacheIndicator();
      renderTable(results);
    } else if (cacheIndicator.classList.contains('hidden')) {
      noResults.textContent = '見つかりませんでした。';
      noResults.classList.remove('hidden');
    }
  } catch (error) {
    // If we already showed cached results, keep them visible
    if (cacheIndicator.classList.contains('hidden')) {
      errorBox.textContent = `エラー: ${error.message || error}`;
      errorBox.classList.remove('hidden');
    } else {
      showCacheIndicator('キャッシュから表示（オフライン）');
    }
  } finally {
    if (cacheIndicator.classList.contains('hidden')) {
      loader.classList.add('hidden');
    }
    searchBtn.disabled = false;
  }
};

searchBtn.addEventListener('click', performSearch);
searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') performSearch();
});

function hideResults() {
  resultsTable.classList.add('hidden');
  noResults.classList.add('hidden');
  tableHeaderRow.innerHTML = '';
  tableBody.innerHTML = '';
}

function renderTable(data) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);

  tableHeaderRow.innerHTML = '';
  headers.forEach((h) => {
    const th = document.createElement('th');
    if (h === 'workName') th.textContent = '作品';
    else if (h === 'category') th.textContent = '分類';
    else if (h === 'musicName') th.textContent = '楽曲';
    else th.textContent = h;

    th.style.cursor = 'pointer';
    th.addEventListener('click', () => {
      if (sortColumn === h) {
        sortAsc = !sortAsc;
      } else {
        sortColumn = h;
        sortAsc = true;
      }
      renderTable(data);
    });

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

// Toggle menu
settingsBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  settingsMenu.classList.toggle('hidden');
});

// Close menu when clicking outside
document.addEventListener('click', () => {
  settingsMenu.classList.add('hidden');
});

settingsMenu.addEventListener('click', (e) => {
  e.stopPropagation();
});

// Font size mapping
const fontSizes = { S: '12px', M: '13px', L: '14px' };

// Apply settings to UI
function applySettings(s) {
  // Default source and mode
  if (s.defaultSource && s.defaultMode) {
    modeSelect.value = `${s.defaultSource}|${s.defaultMode}`;
    updateMirrorVisibility();
  }

  // Default mirror
  if (s.defaultMirror !== undefined) {
    mirrorCheck.checked = s.defaultMirror;
  }

  // Font size
  if (s.fontSize && fontSizes[s.fontSize]) {
    document.body.style.fontSize = fontSizes[s.fontSize];
    settingsFontSize.value = s.fontSize;
  }

  // Window size
  if (s.windowSize) {
    settingsWindowSize.value = s.windowSize;
  }

  // Reflect current settings in menu controls
  const { source, mode } = getCurrentMode();
  settingsSource.value = source;
  settingsMode.value = mode;
  settingsMirror.checked = mirrorCheck.checked;
}

// Save settings when menu controls change
function onSettingChange() {
  window.api.saveSettings({
    defaultSource: settingsSource.value,
    defaultMode: settingsMode.value,
    defaultMirror: settingsMirror.checked,
    fontSize: settingsFontSize.value,
    windowSize: settingsWindowSize.value,
  });
  applySettings({
    defaultSource: settingsSource.value,
    defaultMode: settingsMode.value,
    defaultMirror: settingsMirror.checked,
    fontSize: settingsFontSize.value,
    windowSize: settingsWindowSize.value,
  });
}

settingsSource.addEventListener('change', onSettingChange);
settingsMode.addEventListener('change', onSettingChange);
settingsMirror.addEventListener('change', onSettingChange);
settingsFontSize.addEventListener('change', onSettingChange);
settingsWindowSize.addEventListener('change', () => {
  onSettingChange();
  // Window size setting takes effect on next launch (main.js reads settings on startup)
});

// Clear cache
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

// Load and apply settings on startup
window.api.getSettings().then((s) => {
  applySettings(s || {});
  updateClearCacheLabel();
});
