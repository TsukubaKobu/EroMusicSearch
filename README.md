# EroMusicSearch

A minimalist, native macOS desktop application for bidirectional querying of Anime, Galgame, and Video Game music metadata.

## Features

- **Dual-Engine Search**:
  - **ErogameScape (批评空间)**: Specifically designed to search for Galgame/Eroge music.
  - **Bangumi (番组计划)**: Uses the massive Bangumi REST API to fetch Japanese Anime and general Video Game soundtracks.
- **Bidirectional Querying**:
  - **Work ➔ Music**: Enter the name of an Anime or Game to retrieve all associated Opening, Ending, and Insert songs.
  - **Music ➔ Work**: Enter the name of a song to find which Anime or Game it belongs to.
- **Native macOS Design**: Clean, dark-mode minimalist UI built with Electron.
- **Click-to-Copy**: Instantly copy any cell's content to your clipboard with a single click.
- **Full Japanese Support**: Accurately matches Japanese Kanji, Hiragana, and Katakana for precise searching.

## Tech Stack

- [Electron](https://www.electronjs.org/) - Desktop framework
- [Node.js](https://nodejs.org/) - Backend runtime
- Vanilla HTML/CSS/JS - Frontend UI
- [Cheerio](https://cheerio.js.org/) - HTML parsing for legacy APIs

## Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Build and package the application for macOS (ARM64):
   ```bash
   npm run dist
   ```
   The built application will be available in the `dist/mac-arm64/` directory.

## License
MIT
