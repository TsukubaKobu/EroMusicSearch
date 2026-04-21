# EroMusicSearch

A minimalist desktop application for bidirectional querying of Anime, Galgame, and Video Game music metadata. Supports **macOS** and **Windows**.

## Features

- **Dual-Engine Search**:
  - **ErogameScape (批評空間)**: Specifically designed to search for Galgame/Eroge music.
  - **Bangumi (番組計画)**: Uses the Bangumi REST API to fetch Japanese Anime and general Video Game soundtracks.
- **Bidirectional Querying**:
  - **Work ➔ Music**: Enter the name of an Anime or Game to retrieve all associated Opening, Ending, and Insert songs.
  - **Music ➔ Work**: Enter the name of a song to find which Anime or Game it belongs to.
- **CN Mirror Support**: Toggle the "CN镜像" checkbox to route ErogameScape queries through `koko.kyara.top`, accessible from mainland China.
- **Click-to-Copy**: Instantly copy any table cell's content to your clipboard with a single click.
- **Full Japanese Support**: Accurately matches Kanji, Hiragana, and Katakana for precise searching.
- **Cross-Platform**: Native dark mode UI on macOS; also works on Windows x64.

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
