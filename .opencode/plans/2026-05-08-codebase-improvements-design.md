# Codebase Improvements Design

Date: 2026-05-08 | App: EroMusicSearch v1.4.0

## Overview

Three-phase improvement plan addressing code quality, test coverage, and UX gaps without changing architecture or adding new dependencies (except dev-only eslint/prettier).

---

## Phase 1: Engineering Foundations

### New files

- `.editorconfig` — 2-space indent, LF, UTF-8
- `.prettierrc` — matching EditorConfig
- `eslint.config.js` — ESLint flat config, warn on unused-vars, prefer-const, eqeqeq, no-unused-expressions
- `.github/workflows/ci.yml` — on push/PR: checkout, install, lint, test

### Modified files

- `package.json` — add `lint`, `format`, `test` scripts; add devDependencies: eslint, prettier, eslint-config-prettier

---

## Phase 2: Test Coverage

Tool: Node.js built-in `node:test` + `node:assert` (zero dependencies).

### New files

- `test/constants.test.js` — `toKatakana`, `toHiragana` bidirectional round-trip; `escapeLike` escapes `\`, `%`, `_`, `'`
- `test/erogamescape.test.js` — mock `fetchWithTimeout` with fixture HTML; verify row parsing with `#result` table and fallback to first table
- `test/bangumi.test.js` — mock `fetchWithTimeout` with fixture JSON; verify subject-to-relations mapping, deduplication
- `test/anison.test.js` — mock `fetchWithTimeout` with fixture HTML; verify anime-mode (program detail parsing) and song-mode (list table parsing)

### Modified files

- `src/erogamescape.js` — extract `fetchWithTimeout` usage so tests can inject a mock
- `package.json` — update `"test"` script to `node --test`

---

## Phase 3: Code Fixes

### 3a. Robustness

- `src/anison.js:25` — `Promise.all` → `Promise.allSettled` with success filtering (one failed detail page no longer kills all results)
- `main.js:28` — warmUp catch block logs `console.warn` instead of silent swallow
- `src/bangumi.js:24` — failed relation fetch logs `console.warn` with subject ID

### 3b. Constants (magic numbers)

- `src/constants.js` — add:
  - `BANGUMI_SUBJECT_TYPES` = `{ ANIME: 2, MUSIC: 3, GAME: 4 }`
  - `ANISON_SONG_CATEGORIES` regex string
- `src/bangumi.js:29,37` — use `BANGUMI_SUBJECT_TYPES` constants
- `src/anison.js:44` — use `ANISON_SONG_CATEGORIES` constant

### 3c. UX improvements

- `renderer.js:33` — empty search shows message via #noResults element
- `renderer.js:90` — tooltip: `'Click to copy'` → `'クリックでコピー'`
- `renderer.js:74-82` — column headers become clickable; clicking toggles sort direction (asc/desc toggle per column)
- `main.js:10-11` — on startup, read `window-state.json` from userData to restore bounds; on close, save current bounds

### 3d. Styles

- `styles.css` — add `.sort-asc::after` and `.sort-desc::after` pseudo-elements (↑/↓ indicators on sorted column header)

---

## What is NOT included

- TypeScript migration — out of scope
- E2E tests (Playwright/Spectron) — out of scope
- Auto-update (electron-updater) — out of scope
- Dependency update automation (Dependabot) — separate concern
