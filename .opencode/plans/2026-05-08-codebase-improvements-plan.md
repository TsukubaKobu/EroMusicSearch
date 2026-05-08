# Codebase Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add linting/CI, test coverage, and fix code quality + UX issues across the EroMusicSearch codebase — 3 phases, zero new runtime dependencies.

**Architecture:** Phase 1 adds dev tooling (ESLint/Prettier/CI). Phase 2 adds unit tests using `node:test` with injectable fetch mocks. Phase 3 applies targeted code fixes (Promise.allSettled, constants, logging, table sorting, window state).

**Tech Stack:** Node.js native `node:test` + `node:assert`, ESLint flat config, GitHub Actions

---

### Task 1.1: Initialize .editorconfig

**Files:**

- Create: `.editorconfig`

- [ ] **Step 1: Write .editorconfig**

```
root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true
```

- [ ] **Step 2: Commit**

```bash
git add .editorconfig && git commit -m "chore: add .editorconfig"
```

---

### Task 1.2: Initialize .prettierrc

**Files:**

- Create: `.prettierrc`

- [ ] **Step 1: Write .prettierrc**

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5",
  "tabWidth": 2,
  "printWidth": 120,
  "endOfLine": "lf"
}
```

- [ ] **Step 2: Commit**

```bash
git add .prettierrc && git commit -m "chore: add .prettierrc"
```

---

### Task 1.3: Initialize ESLint config and add devDependencies

**Files:**

- Create: `eslint.config.js`
- Modify: `package.json` — add scripts and devDependencies

- [ ] **Step 1: Install devDependencies**

```bash
npm install --save-dev eslint prettier eslint-config-prettier
```

- [ ] **Step 2: Write eslint.config.js**

```js
const prettier = require('eslint-config-prettier');

module.exports = [
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-undef': 'error',
      'prefer-const': 'error',
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-unused-expressions': 'error',
    },
  },
  prettier,
];
```

- [ ] **Step 3: Update package.json scripts and devDependencies**

Read current `package.json`, then update the `"scripts"` block to include:

```json
"scripts": {
  "start": "electron .",
  "pack": "electron-builder --dir",
  "dist": "electron-builder",
  "lint": "eslint .",
  "format": "prettier --write .",
  "test": "node --test"
},
```

And ensure `devDependencies` includes:

```json
"devDependencies": {
  "electron": "^34.0.0",
  "electron-builder": "^25.0.0",
  "eslint": "^9.0.0",
  "prettier": "^3.0.0",
  "eslint-config-prettier": "^10.0.0"
}
```

- [ ] **Step 4: Run lint to verify it works**

```bash
npm run lint
```

Expected: Some warnings (unused vars etc.) but no errors.

- [ ] **Step 5: Run format to prettify all files**

```bash
npm run format
```

Expected: Files reformatted (2-space indent, single quotes, trailing commas).

- [ ] **Step 6: Commit**

```bash
git add eslint.config.js package.json package-lock.json
git commit -m "chore: add ESLint, Prettier, and lint/format/test scripts"
git add -A && git commit -m "style: apply Prettier formatting"
```

---

### Task 1.4: Add GitHub Actions CI

**Files:**

- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create workflow directory and write ci.yml**

```bash
mkdir -p .github/workflows
```

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm test
```

- [ ] **Step 2: Verify workflow file is valid YAML**

```bash
cat .github/workflows/ci.yml
```

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/ci.yml && git commit -m "ci: add GitHub Actions CI (lint + test)"
```

---

### Task 2.1: Make search functions accept injectable fetch for testing

**Files:**

- Modify: `src/erogamescape.js:1-77`
- Modify: `src/bangumi.js:1-61`
- Modify: `src/anison.js:1-75`
- Modify: `main.js:40-50`

- [ ] **Step 1: Update erogamescape.js to accept optional fetchFn**

Change function signature and internal fetch calls:

```js
async function searchErogameScape(term, mode, mirrorMode, _fetch = fetchWithTimeout) {
  // ... same code, but replace all fetchWithTimeout(egsUrl, ...) with _fetch(egsUrl, ...)
```

Specifically line 40: `const response = await _fetch(egsUrl, { method: 'POST', body: new URLSearchParams({ sql }) });`

- [ ] **Step 2: Update bangumi.js to accept optional fetchFn**

```js
async function searchBangumi(term, mode, _fetch = fetchWithTimeout) {
```

Replace `fetchWithTimeout(` with `_fetch(` on lines 7 and 20.

- [ ] **Step 3: Update anison.js to accept optional fetchFn**

```js
async function searchAnison(term, mode, _fetch = fetchWithTimeout) {
```

Replace `fetchWithTimeout(` with `_fetch(` on lines 11, 27, 52.

- [ ] **Step 4: Update main.js IPC handler to pass extra arg**

```js
ipcMain.handle('search-database', async (event, { source, mode, term, mirrorMode }) => {
  switch (source) {
    case SOURCES.EROGAMESCAPE:
      return await searchErogameScape(term, mode, mirrorMode);
    // ... unchanged
  }
});
```

No change needed in main.js — the default parameter means existing callers work as-is.

- [ ] **Step 5: Run lint to verify no regressions**

```bash
npm run lint
```

- [ ] **Step 6: Commit**

```bash
git add src/erogamescape.js src/bangumi.js src/anison.js && git commit -m "refactor: make search functions accept injectable fetch for testing"
```

---

### Task 2.2: Write unit tests for constants.js

**Files:**

- Create: `test/constants.test.js`

- [ ] **Step 1: Create test directory**

```bash
mkdir -p test
```

- [ ] **Step 2: Write test/constants.test.js**

```js
const { describe, it } = require('node:test');
const assert = require('node:assert');
const { toKatakana, toHiragana, escapeLike } = require('../src/constants');

describe('toKatakana', () => {
  it('converts hiragana to katakana', () => {
    assert.strictEqual(toKatakana('あいうえお'), 'アイウエオ');
  });

  it('does not modify non-hiragana characters', () => {
    assert.strictEqual(toKatakana('漢字ABC'), '漢字ABC');
    assert.strictEqual(toKatakana('アイウ'), 'アイウ');
  });

  it('handles mixed strings', () => {
    assert.strictEqual(toKatakana('あいアイうえ'), 'アイアイウエ');
  });
});

describe('toHiragana', () => {
  it('converts katakana to hiragana', () => {
    assert.strictEqual(toHiragana('アイウエオ'), 'あいうえお');
  });

  it('does not modify non-katakana characters', () => {
    assert.strictEqual(toHiragana('漢字ABC'), '漢字ABC');
    assert.strictEqual(toHiragana('あいう'), 'あいう');
  });

  it('handles mixed strings', () => {
    assert.strictEqual(toHiragana('アイあいうエ'), 'あいあいうえ');
  });

  it('round-trips through toKatakana', () => {
    assert.strictEqual(toHiragana(toKatakana('あいうえお')), 'あいうえお');
    assert.strictEqual(toKatakana(toHiragana('アイウエオ')), 'アイウエオ');
  });
});

describe('escapeLike', () => {
  it('escapes backslash', () => {
    assert.strictEqual(escapeLike('a\\b'), 'a\\\\b');
  });

  it('escapes percent', () => {
    assert.strictEqual(escapeLike('100%'), '100\\%');
  });

  it('escapes underscore', () => {
    assert.strictEqual(escapeLike('a_b'), 'a\\_b');
  });

  it('escapes single quote', () => {
    assert.strictEqual(escapeLike("it's"), "it''s");
  });

  it('escapes combined special characters', () => {
    assert.strictEqual(escapeLike('100%_test'), '100\\%\\_test');
  });

  it('does not modify safe strings', () => {
    assert.strictEqual(escapeLike('hello world'), 'hello world');
    assert.strictEqual(escapeLike('こんにちは'), 'こんにちは');
  });
});
```

- [ ] **Step 3: Run tests to verify they pass**

```bash
npm test
```

Expected: All constants tests pass.

- [ ] **Step 4: Commit**

```bash
git add test/constants.test.js && git commit -m "test: add unit tests for kana conversion and SQL escaping"
```

---

### Task 2.3: Write unit tests for erogamescape.js

**Files:**

- Create: `test/erogamescape.test.js`

- [ ] **Step 1: Write test/erogamescape.test.js**

```js
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
```

- [ ] **Step 2: Run tests to verify they pass**

```bash
npm test
```

Expected: 5 tests pass.

- [ ] **Step 3: Commit**

```bash
git add test/erogamescape.test.js && git commit -m "test: add unit tests for ErogameScape HTML parsing"
```

---

### Task 2.4: Write unit tests for bangumi.js

**Files:**

- Create: `test/bangumi.test.js`

- [ ] **Step 1: Write test/bangumi.test.js**

```js
const { describe, it } = require('node:test');
const assert = require('node:assert');
const { searchBangumi } = require('../src/bangumi');

function mockFetch(searchBody, relationsBodies) {
  let callIndex = 0;
  return async (url) => {
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
    const results = await searchBangumi('anime', 'gameToMusic', mockFetch(searchBody, relationsBody));
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
    const results = await searchBangumi('song', 'musicToGame', mockFetch(searchBody, relationsBody));
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
    const results = await searchBangumi('anime', 'gameToMusic', mockFetch(searchBody, relationsBody));
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
```

- [ ] **Step 2: Run tests to verify they pass**

```bash
npm test
```

Expected: 5 tests pass (plus prior tests).

- [ ] **Step 3: Commit**

```bash
git add test/bangumi.test.js && git commit -m "test: add unit tests for Bangumi API mapping"
```

---

### Task 2.5: Write unit tests for anison.js

**Files:**

- Create: `test/anison.test.js`

- [ ] **Step 1: Write test/anison.test.js**

```js
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
    const searchHtml = "<a href=\"javascript:link('program','123')\">Program A</a>";
    const detailHtml = '<table><tr><td>OP</td><td>Opening Song</td></tr></table>';
    const results = await searchAnison('program', 'gameToMusic', mockFetch(searchHtml, [detailHtml]));
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].workName, 'Program A');
    assert.strictEqual(results[0].category, 'OP');
    assert.strictEqual(results[0].musicName, 'Opening Song');
  });

  it('filters non-music category rows in detail pages', async () => {
    const searchHtml = "<a href=\"javascript:link('program','123')\">Program B</a>";
    const detailHtml = '<table><tr><td>Staff</td><td>Name</td></tr><tr><td>OP</td><td>Song</td></tr></table>';
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
```

- [ ] **Step 2: Run tests to verify they pass**

```bash
npm test
```

Expected: 5 tests pass (total 15+ tests across all test files).

- [ ] **Step 3: Commit**

```bash
git add test/anison.test.js && git commit -m "test: add unit tests for Anison.info HTML scraping"
```

---

### Task 3.1: Promise.all → Promise.allSettled in anison.js

**Files:**

- Modify: `src/anison.js:25-34`

- [ ] **Step 1: Replace Promise.all with Promise.allSettled**

Change lines 25-34 from:

```js
const detailPages = await Promise.all(
  programs.slice(0, MAX_WORKS).map(async (prog) => {
    const detailRes = await fetchWithTimeout(`${baseUrl}program/${prog.id}.html`, { headers: UA });
    const detailHtml = await detailRes.text();
    return { prog, html: detailHtml };
  })
);
```

To:

```js
const detailResults = await Promise.allSettled(
  programs.slice(0, MAX_WORKS).map(async (prog) => {
    const detailRes = await _fetch(`${baseUrl}program/${prog.id}.html`, { headers: UA });
    const detailHtml = await detailRes.text();
    return { prog, html: detailHtml };
  })
);
const detailPages = detailResults.filter((r) => r.status === 'fulfilled').map((r) => r.value);
```

Note: This also uses `_fetch` (from Task 2.1 refactor).

- [ ] **Step 2: Run tests to verify no regression**

```bash
npm test
npm run lint
```

- [ ] **Step 3: Commit**

```bash
git add src/anison.js && git commit -m "fix: use Promise.allSettled in Anison detail fetching to avoid fail-fast"
```

---

### Task 3.2: Add constants for magic numbers

**Files:**

- Modify: `src/constants.js`

- [ ] **Step 1: Add BANGUMI_SUBJECT_TYPES and ANISON_SONG_CATEGORIES to exports**

Add before `module.exports`:

```js
const BANGUMI_SUBJECT_TYPES = {
  BOOK: 1,
  ANIME: 2,
  MUSIC: 3,
  GAME: 4,
  REAL: 6,
};

const ANISON_SONG_CATEGORIES = /^(OP|ED|IN|AR|IM|TM)/;
```

Add to `module.exports`:

```js
module.exports = {
  EGS_URLS,
  ANISON_BASE,
  BANGUMI_BASE,
  BANGUMI_UA,
  RETRY_DELAY_MS,
  TIMEOUT_MS,
  MAX_WORKS,
  fetchWithTimeout,
  MODES,
  SOURCES,
  toKatakana,
  toHiragana,
  escapeLike,
  BANGUMI_SUBJECT_TYPES,
  ANISON_SONG_CATEGORIES,
};
```

- [ ] **Step 2: Run tests**

```bash
npm test
```

- [ ] **Step 3: Commit**

```bash
git add src/constants.js && git commit -m "refactor: add BANGUMI_SUBJECT_TYPES and ANISON_SONG_CATEGORIES constants"
```

---

### Task 3.3: Use constants in bangumi.js

**Files:**

- Modify: `src/bangumi.js`

- [ ] **Step 1: Import new constants**

Change line 1 from:

```js
const { BANGUMI_BASE, BANGUMI_UA, MODES, MAX_WORKS, fetchWithTimeout } = require('./constants');
```

To:

```js
const { BANGUMI_BASE, BANGUMI_UA, MODES, MAX_WORKS, BANGUMI_SUBJECT_TYPES, fetchWithTimeout } = require('./constants');
```

- [ ] **Step 2: Replace magic numbers**

Line 5: `const type = isAnimeMode ? '2' : '3';` →

```js
const type = isAnimeMode ? String(BANGUMI_SUBJECT_TYPES.ANIME) : String(BANGUMI_SUBJECT_TYPES.MUSIC);
```

Line 29: `if (rel.type === 3)` →

```js
if (rel.type === BANGUMI_SUBJECT_TYPES.MUSIC)
```

Line 37: `if (rel.type === 2 || rel.type === 4)` →

```js
if (rel.type === BANGUMI_SUBJECT_TYPES.ANIME || rel.type === BANGUMI_SUBJECT_TYPES.GAME)
```

- [ ] **Step 3: Run tests + lint**

```bash
npm test && npm run lint
```

- [ ] **Step 4: Commit**

```bash
git add src/bangumi.js && git commit -m "refactor: replace Bangumi magic numbers with BANGUMI_SUBJECT_TYPES constants"
```

---

### Task 3.4: Use constants in anison.js

**Files:**

- Modify: `src/anison.js`

- [ ] **Step 1: Import new constant**

Change line 2 from:

```js
const { ANISON_BASE, MODES, MAX_WORKS, fetchWithTimeout } = require('./constants');
```

To:

```js
const { ANISON_BASE, MODES, MAX_WORKS, ANISON_SONG_CATEGORIES, fetchWithTimeout } = require('./constants');
```

- [ ] **Step 2: Replace hardcoded regex**

Line 44: `if (/^(OP|ED|IN|AR|IM)/.test(category) && musicName)` →

```js
if (ANISON_SONG_CATEGORIES.test(category) && musicName)
```

- [ ] **Step 3: Run tests + lint**

```bash
npm test && npm run lint
```

- [ ] **Step 4: Commit**

```bash
git add src/anison.js && git commit -m "refactor: replace Anison hardcoded category regex with constant"
```

---

### Task 3.5: Add logging for silent error swallows

**Files:**

- Modify: `main.js:27-28`
- Modify: `src/bangumi.js:24`

- [ ] **Step 1: Add warn log to warmUp catch in main.js**

Change line 28 from:

```js
warmUp(EGS_URLS.mirror);
```

Insert after that line:

```js
warmUp(EGS_URLS.mirror);

// ... actually, the warmUp already has .catch(() => {}).
// We need to add console.warn inside the catch.
```

Change lines 27-28 from:

```js
const warmUp = (url) => fetchWithTimeout(url, { method: 'GET' }).catch(() => {});
warmUp(EGS_URLS.primary);
warmUp(EGS_URLS.mirror);
```

To:

```js
const warmUp = (url, label) =>
  fetchWithTimeout(url, { method: 'GET' }).catch((e) => console.warn(`Warm-up failed for ${label}:`, e.message));
warmUp(EGS_URLS.primary, 'EGS primary');
warmUp(EGS_URLS.mirror, 'EGS mirror');
```

- [ ] **Step 2: Add warn log to failed relation fetch in bangumi.js**

Change lines 24-25 from:

```js
if (!relRes.ok) continue;
```

To:

```js
if (!relRes.ok) {
  console.warn(`Relation fetch failed for subject ${subject.id}: HTTP ${relRes.status}`);
  continue;
}
```

- [ ] **Step 3: Run lint**

```bash
npm run lint
```

- [ ] **Step 4: Commit**

```bash
git add main.js src/bangumi.js && git commit -m "fix: add console.warn for silent error swallows in warmUp and Bangumi relation fetch"
```

---

### Task 3.6: Empty search feedback

**Files:**

- Modify: `renderer.js:32-33`

- [ ] **Step 1: Show feedback when search term is empty**

Change lines 32-33 from:

```js
const term = searchInput.value.trim();
if (!term) return;
```

To:

```js
const term = searchInput.value.trim();
if (!term) {
  hideResults();
  errorBox.classList.add('hidden');
  noResults.textContent = '検索キーワードを入力してください。';
  noResults.classList.remove('hidden');
  return;
}
```

- [ ] **Step 2: Reset noResults text before showing "not found"**

In the `performSearch` function, before the line `noResults.classList.remove('hidden');` (currently line 47), add:

```js
noResults.textContent = '見つかりませんでした。';
```

- [ ] **Step 3: Run lint**

```bash
npm run lint
```

- [ ] **Step 4: Commit**

```bash
git add renderer.js && git commit -m "feat: show feedback when searching with empty input"
```

---

### Task 3.7: Japanese copy tooltip

**Files:**

- Modify: `renderer.js:90`

- [ ] **Step 1: Change tooltip text**

Change line 90 from:

```js
td.title = 'Click to copy';
```

To:

```js
td.title = 'クリックでコピー';
```

- [ ] **Step 2: Run lint**

```bash
npm run lint
```

- [ ] **Step 3: Commit**

```bash
git add renderer.js && git commit -m "feat: change copy tooltip to Japanese"
```

---

### Task 3.8: Table column sorting

**Files:**

- Modify: `renderer.js:70-100`
- Modify: `styles.css` — add sort indicator styles

- [ ] **Step 1: Add sort state and logic to renderer.js**

Add a module-level variable near the top:

```js
let sortColumn = null;
let sortAsc = true;
```

Replace the header rendering section (lines 74-82) starting from:

```js
tableHeaderRow.innerHTML = '';
headers.forEach(h => {
```

Up to:

```js
tableHeaderRow.appendChild(th);
});
```

With:

```js
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
```

- [ ] **Step 2: Add sorting before row rendering**

Before the line `tableBody.innerHTML = '';` (currently line 84), add:

```js
if (sortColumn) {
  data = [...data].sort((a, b) => {
    const va = (a[sortColumn] || '').toString();
    const vb = (b[sortColumn] || '').toString();
    const cmp = va.localeCompare(vb, 'ja');
    return sortAsc ? cmp : -cmp;
  });
}
```

- [ ] **Step 3: Add CSS sort indicators to styles.css**

Add after line 179 (`td:hover { background: var(--hover); }`):

```css
th.sort-asc::after {
  content: ' ↑';
  color: var(--accent);
}

th.sort-desc::after {
  content: ' ↓';
  color: var(--accent);
}
```

- [ ] **Step 4: Run lint**

```bash
npm run lint
```

- [ ] **Step 5: Commit**

```bash
git add renderer.js styles.css && git commit -m "feat: add table column sorting with click-to-toggle on headers"
```

---

### Task 3.9: Window state persistence

**Files:**

- Modify: `main.js:8-22`

- [ ] **Step 1: Add window state save/restore logic**

Replace the `createWindow` function with:

```js
const fs = require('fs');
const statePath = path.join(app.getPath('userData'), 'window-state.json');

function loadWindowState() {
  try {
    if (fs.existsSync(statePath)) {
      return JSON.parse(fs.readFileSync(statePath, 'utf-8'));
    }
  } catch (e) {
    console.warn('Failed to load window state:', e.message);
  }
  return {};
}

function saveWindowState(win) {
  try {
    const bounds = win.getBounds();
    fs.writeFileSync(statePath, JSON.stringify(bounds));
  } catch (e) {
    console.warn('Failed to save window state:', e.message);
  }
}

function createWindow() {
  const saved = loadWindowState();
  const mainWindow = new BrowserWindow({
    width: saved.width || 900,
    height: saved.height || 700,
    x: saved.x,
    y: saved.y,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#0f172a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile('index.html');

  mainWindow.on('close', () => saveWindowState(mainWindow));

  return mainWindow;
}
```

Note: `fs` and `path` are already imported in main.js.

- [ ] **Step 2: Run lint**

```bash
npm run lint
```

- [ ] **Step 3: Commit**

```bash
git add main.js && git commit -m "feat: persist and restore window position and size on restart"
```

---

### Task 3.10: Final verification

**Files:**

- All modified files

- [ ] **Step 1: Run full test suite**

```bash
npm test
```

Expected: All 15+ tests pass.

- [ ] **Step 2: Run linter**

```bash
npm run lint
```

Expected: No errors, possibly some warnings (which are acceptable).

- [ ] **Step 3: Verify app starts (optional)**

```bash
npm start
```

Expected: Window appears, no errors in console.

- [ ] **Step 4: Final commit if any formatting changes remain**

```bash
git status
```
