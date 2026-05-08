# Cache + Settings Menu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add search result caching (cache-first + background refresh, never expires) and a settings dropdown menu (default source/mode/mirror, font size, window size, clear cache).

**Architecture:** Cache stored as JSON in `{userData}/search-cache.json`. Settings stored in `{userData}/settings.json`. New IPC handlers in main.js expose cache and settings CRUD to renderer via preload.js. Settings menu is a pure CSS dropdown from a gear button in the search bar.

**Tech Stack:** Node.js `fs` (no new dependencies), CSS dropdown menu

---

### Task 1: Add cache and settings IPC handlers to main.js

**Files:**
- Modify: `main.js`

- [ ] **Step 1: Add cache path and settings path constants**

Add after line 9 (`const statePath = ...`):

```js
const cachePath = path.join(app.getPath('userData'), 'search-cache.json');
const settingsPath = path.join(app.getPath('userData'), 'settings.json');
```

- [ ] **Step 2: Add cache IPC handlers**

Add before the final `ipcMain.handle('search-database'...)` block (before line 73):

```js
function loadCache() {
  try {
    if (fs.existsSync(cachePath)) {
      return JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
    }
  } catch (e) {
    console.warn('Failed to load cache:', e.message);
  }
  return {};
}

function saveCache(cache) {
  try {
    fs.writeFileSync(cachePath, JSON.stringify(cache));
  } catch (e) {
    console.warn('Failed to save cache:', e.message);
  }
}

let cache = null;

ipcMain.handle('get-cache', async () => {
  if (!cache) cache = loadCache();
  return cache;
});

ipcMain.handle('set-cache', async (event, { key, results }) => {
  if (!cache) cache = loadCache();
  cache[key] = { results, cachedAt: Date.now() };
  saveCache(cache);
});

ipcMain.handle('clear-cache', async () => {
  cache = {};
  saveCache(cache);
  return Object.keys(cache).length;
});
```

- [ ] **Step 3: Add settings IPC handlers**

Add after the cache handlers:

```js
function loadSettings() {
  try {
    if (fs.existsSync(settingsPath)) {
      return JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    }
  } catch (e) {
    console.warn('Failed to load settings:', e.message);
  }
  return {};
}

function saveSettings(settings) {
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(settings));
  } catch (e) {
    console.warn('Failed to save settings:', e.message);
  }
}

let settings = null;

ipcMain.handle('get-settings', async () => {
  if (!settings) settings = loadSettings();
  return settings;
});

ipcMain.handle('save-settings', async (event, newSettings) => {
  settings = { ...loadSettings(), ...newSettings };
  saveSettings(settings);
  return settings;
});
```

- [ ] **Step 4: Update createWindow to use settings window size as default**

In the `createWindow` function, change the BrowserWindow constructor. Read settings to get the default window size:

```js
function createWindow() {
  const saved = loadWindowState();
  const appSettings = loadSettings();
  const defaultSize = (appSettings.windowSize || '900x700').split('x').map(Number);
  const mainWindow = new BrowserWindow({
    width: saved.width || defaultSize[0],
    height: saved.height || defaultSize[1],
    // ... rest unchanged
  });
```

- [ ] **Step 5: Run lint**

```bash
npm run lint
```

- [ ] **Step 6: Commit**

```bash
git add main.js && git commit -m "feat: add cache and settings IPC handlers"
```

---

### Task 2: Update preload.js to expose new APIs

**Files:**
- Modify: `preload.js`

- [ ] **Step 1: Replace preload.js content**

```js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  searchDatabase: (args) => ipcRenderer.invoke('search-database', args),
  getCache: () => ipcRenderer.invoke('get-cache'),
  setCache: (key, results) => ipcRenderer.invoke('set-cache', { key, results }),
  clearCache: () => ipcRenderer.invoke('clear-cache'),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
});
```

- [ ] **Step 2: Run lint**

```bash
npm run lint
```

- [ ] **Step 3: Commit**

```bash
git add preload.js && git commit -m "feat: expose cache and settings APIs via preload bridge"
```

---

### Task 3: Add cache-first search logic to renderer.js

**Files:**
- Modify: `renderer.js`

- [ ] **Step 1: Add cache indicator element reference**

Add after line 10 (after `const tableBody = ...`):

```js
const cacheIndicator = document.getElementById('cacheIndicator');
```

- [ ] **Step 2: Replace the performSearch function**

Replace lines 34-66 (the entire `performSearch` function):

```js
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
  } catch (_) {
    // Cache read failure is non-critical
  }

  // Network search (background if cache was shown)
  try {
    const results = await window.api.searchDatabase({ source, mode, term, mirrorMode });

    // Save to cache
    try {
      await window.api.setCache(cacheKey, results);
    } catch (_) {
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
```

- [ ] **Step 3: Run lint**

```bash
npm run lint
```

- [ ] **Step 4: Commit**

```bash
git add renderer.js && git commit -m "feat: add cache-first search with background refresh"
```

---

### Task 4: Add settings menu HTML and cache indicator

**Files:**
- Modify: `index.html`
- Modify: `styles.css`

- [ ] **Step 1: Add settings button and menu HTML in index.html**

Add inside the `.search-bar` div, after the mirror-label (after line 46, `</label>`):

```html
<div class="settings-wrapper">
  <button id="settingsBtn" class="settings-btn" title="設定">⚙</button>
  <div id="settingsMenu" class="settings-menu hidden">
    <div class="menu-section">
      <div class="menu-label">検索</div>
      <div class="menu-row">
        <span>既定のデータソース</span>
        <select id="settingsSource">
          <option value="erogamescape">EGS</option>
          <option value="bangumi">Bangumi</option>
          <option value="anison">Anison.info</option>
        </select>
      </div>
      <div class="menu-row">
        <span>既定の検索方向</span>
        <select id="settingsMode">
          <option value="gameToMusic">作品→音楽</option>
          <option value="musicToGame">音楽→作品</option>
        </select>
      </div>
      <div class="menu-row">
        <label class="menu-check">
          <input type="checkbox" id="settingsMirror" />
          CNミラーを既定でON
        </label>
      </div>
    </div>
    <div class="menu-section">
      <div class="menu-label">外観</div>
      <div class="menu-row">
        <span>フォントサイズ</span>
        <select id="settingsFontSize">
          <option value="S">S</option>
          <option value="M">M</option>
          <option value="L">L</option>
        </select>
      </div>
      <div class="menu-row">
        <span>ウィンドウサイズ</span>
        <select id="settingsWindowSize">
          <option value="800x600">800×600</option>
          <option value="900x700">900×700</option>
          <option value="1024x768">1024×768</option>
        </select>
      </div>
    </div>
    <div class="menu-section">
      <button id="clearCacheBtn" class="menu-btn">🗑 キャッシュを削除</button>
    </div>
  </div>
</div>
```

- [ ] **Step 2: Add cache indicator HTML**

Add after the `#noResults` div (after line 51):

```html
<div id="cacheIndicator" class="hidden cache-indicator"></div>
```

- [ ] **Step 3: Add settings menu CSS to styles.css**

Add at the end of styles.css:

```css
/* Settings menu */
.settings-wrapper {
  position: relative;
  flex-shrink: 0;
}

.settings-btn {
  padding: 0 8px;
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text);
  font-size: 14px;
  cursor: pointer;
  line-height: 1;
  height: 100%;
}

.settings-btn:active {
  background: #444;
}

.settings-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 8px 0;
  min-width: 220px;
  z-index: 100;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

.menu-section {
  padding: 4px 12px;
}

.menu-section + .menu-section {
  border-top: 1px solid var(--border);
  margin-top: 4px;
  padding-top: 8px;
}

.menu-label {
  font-size: 10px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.menu-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 3px 0;
  font-size: 12px;
}

.menu-row span {
  color: var(--text);
}

.menu-row select {
  font-size: 11px;
  padding: 1px 4px;
  background: var(--bg3);
  border: 1px solid var(--border);
  border-radius: 4px;
  color: var(--text);
  outline: none;
}

.menu-check {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text);
  cursor: pointer;
}

.menu-check input {
  accent-color: var(--accent);
}

.menu-btn {
  width: 100%;
  padding: 4px 0;
  background: none;
  border: none;
  color: var(--text);
  font-size: 12px;
  cursor: pointer;
  text-align: left;
}

.menu-btn:hover {
  color: #ff6b6b;
}

/* Cache indicator */
.cache-indicator {
  text-align: center;
  padding: 4px 0;
  color: var(--accent);
  font-size: 11px;
}
```

- [ ] **Step 4: Run lint**

```bash
npm run lint
```

- [ ] **Step 5: Commit**

```bash
git add index.html styles.css && git commit -m "feat: add settings menu HTML/CSS and cache indicator"
```

---

### Task 5: Add settings menu JS logic and apply defaults

**Files:**
- Modify: `renderer.js`

- [ ] **Step 1: Add DOM element references at top**

Add after line 11 (after `const cacheIndicator = ...` from Task 3):

```js
const settingsBtn = document.getElementById('settingsBtn');
const settingsMenu = document.getElementById('settingsMenu');
const settingsSource = document.getElementById('settingsSource');
const settingsMode = document.getElementById('settingsMode');
const settingsMirror = document.getElementById('settingsMirror');
const settingsFontSize = document.getElementById('settingsFontSize');
const settingsWindowSize = document.getElementById('settingsWindowSize');
const clearCacheBtn = document.getElementById('clearCacheBtn');
```

- [ ] **Step 2: Add font size CSS variable reference**

Add a CSS variable for font size. In `:root` we'll use `--font-size` but the CSS needs to be added. Actually, we'll handle font size by setting `document.body.style.fontSize`.

- [ ] **Step 2 (actual): Add settings initialization and events at the bottom of renderer.js**

Add at the end of the file (after line 138):

```js
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
  } catch (_) {
    clearCacheBtn.textContent = '🗑 キャッシュを削除';
  }
}

// Load and apply settings on startup
window.api.getSettings().then((s) => {
  applySettings(s || {});
  updateClearCacheLabel();
});
```

- [ ] **Step 3: Run lint**

```bash
npm run lint
```

- [ ] **Step 4: Commit**

```bash
git add renderer.js && git commit -m "feat: add settings menu JS logic with defaults on startup"
```

---

### Task 6: Write cache operations unit test

**Files:**
- Create: `test/cache.test.js`

- [ ] **Step 1: Write test/cache.test.js**

```js
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
    // Start with clean state
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
```

- [ ] **Step 2: Run tests**

```bash
npm test
```

Expected: 34 tests pass (28 existing + 6 new).

- [ ] **Step 3: Run lint**

```bash
npm run lint
```

- [ ] **Step 4: Commit**

```bash
git add test/cache.test.js && git commit -m "test: add cache operations unit tests"
```

---

### Task 7: Final verification

- [ ] **Step 1: Run full test suite**

```bash
npm test
```

Expected: All 34 tests pass.

- [ ] **Step 2: Run linter**

```bash
npm run lint
```

Expected: 0 errors, 0 warnings.

- [ ] **Step 3: Verify git status**

```bash
git status
git log --oneline -5
```
