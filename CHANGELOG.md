# Changelog

All notable changes to this project will be documented in this file.

## [1.4.0] - 2026-04-27

### Added
- **Fetch timeout protection**: All external API calls now use `AbortController` with a 15-second timeout, preventing the app from freezing when an external service is unresponsive.
- **CN Mirror auto-hide**: The "CN镜像" checkbox now only appears when ErogameScape mode is selected, reducing confusion when using Bangumi or Anison.info.
- **MAX_WORKS constant**: The hardcoded limit `3` in Bangumi and Anison results has been extracted to a named constant (`MAX_WORKS`) in `constants.js` for better maintainability.

### Changed
- **Code modularization**: Refactored the monolithic `main.js` IPC handler (~250 lines) into separate modules under `src/` (`constants.js`, `erogamescape.js`, `bangumi.js`, `anison.js`), improving readability and maintainability.
- **UI text fully localized to Japanese**: Error messages, loader text, and "no results" messages are now consistently in Japanese (was a mix of English/Japanese/Chinese).
- **`package.json` description updated**: Now mentions all three data sources (previously only mentioned ErogameScape).
- **Version bumped to 1.4.0**.

---

## [1.3.0] - 2026-04-22

### Added
- **Anison.info integration**: Added `Anison.info` as a third data source, providing comprehensive anime song metadata from the Anison Generation database.
  - **作品→音楽**: Search by anime/program title to get all OP/ED/IN/AR songs.
  - **音楽→作品**: Search by song title to find which anime or game it was used in, along with usage type (OP/ED/IN) and media genre (TV/GM/VD).
- The search results from Anison.info include artist name, genre tag, and usage classification for rich context.

---

## [1.2.0] - 2026-04-22

### Fixed
- **First-search bug**: The very first search after launching the app would return no results due to ErogameScape's session not being initialized yet.
  - Added startup pre-warm: the app silently fetches both EGS endpoints (original + CN mirror) in the background when launched.
  - Added auto-retry: if EGS returns an empty result, the query automatically retries once after 800ms — seamlessly, with no user intervention required.

---

## [1.1.0] - 2026-04-22

### Added
- **CN Mirror Support**: Added a "CN镜像" checkbox in the search bar. When checked, ErogameScape queries are routed to the reverse-proxy mirror at `koko.kyara.top`, which is accessible from mainland China.
- **Windows x64 build**: The app is now also packaged as a Windows NSIS installer (`EroMusicSearch Setup x.x.x.exe`) with a user-selectable installation directory.
- **Scrollbars**: Results area now scrolls vertically when rows exceed window height, and horizontally when the window is too narrow, with a native macOS-style thin scrollbar.
- **Simplified UI**: Two separate tab rows (source + direction) were merged into a single compact dropdown menu, reducing vertical space usage. Table headers are now displayed in Japanese (作品 / 分類 / 楽曲).
- **Mode order**: ErogameScape options now appear first in the dropdown, followed by Bangumi.

### Fixed
- **Stale mode state**: Source and mode are now always read directly from the dropdown element at search time, preventing a mismatch when Electron restores form state across sessions.

---

## [1.0.0] - 2026-04-21

### Initial Release
- **Dual-engine search**: ErogameScape (批評空間) for Galgame/Eroge, and Bangumi (番組計画) for Anime and general games.
- **Bidirectional querying**: Work → Music and Music → Work for both data sources.
- **Japanese fuzzy search**: Hiragana ↔ Katakana automatic conversion for ErogameScape queries.
- **Click-to-copy**: Click any table cell to instantly copy its content to the clipboard.
- **Native macOS dark mode UI**: Minimalist black-and-white design with hiddenInset title bar.
- **Japanese names priority**: Bangumi results always display the original Japanese name (`name`) over the Chinese translation (`name_cn`).
