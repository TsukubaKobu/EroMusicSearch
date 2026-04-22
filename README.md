# EroMusicSearch

> 游戏・アニメ楽曲の双方向検索ツール  
> A bidirectional ACG music metadata search tool for macOS and Windows.

---

## 概要 / Overview

EroMusicSearch は、ゲームやアニメの楽曲情報を **3 つのデータソース** から横断的に検索できるデスクトップアプリです。  
曲名から作品を調べたり、作品名から全 OP/ED/IN を一覧したりと、双方向の検索に対応しています。

EroMusicSearch is a desktop application for bidirectional lookup of ACG music metadata across **three data sources** — search by song to find the anime/game, or search by anime/game to list all its songs.

---

## データソース / Data Sources

| Source | 対応ジャンル | 特徴 |
|---|---|---|
| **ErogameScape (批評空間)** | ギャルゲー / エロゲー | ゲーム音楽の網羅性が高い |
| **Bangumi (番組計画)** | アニメ・ゲーム全般 | 日本語タイトルに完全対応、API ベース |
| **Anison.info** | アニメ・ゲーム・映画 | アニソン専門DB、OP/ED/IN/AR まで網羅 |

---

## 機能 / Features

- **6 種類の検索モード** (ドロップダウンで切り替え)
  - `EGS：作品 → 音楽` — ゲームタイトルで楽曲を一覧
  - `EGS：音楽 → 作品` — 楽曲名でゲームを逆引き
  - `Bangumi：作品 → 音楽` — アニメ/ゲームタイトルから関連楽曲
  - `Bangumi：音楽 → 作品` — 楽曲名からアニメ/ゲームを逆引き
  - `Anison.info：作品 → 音楽` — 作品の全 OP/ED/IN/AR を取得
  - `Anison.info：音楽 → 作品` — 曲名から使用作品・用途・ジャンルを取得

- **クリックでコピー** — テーブルの任意のセルをクリックするとクリップボードにコピー（フィードバックあり）

- **日本語ファジー検索** — ひらがな ↔ カタカナ自動変換 (ErogameScape)

- **CN ミラー対応** — 「CN镜像」チェックボックスで ErogameScape のリクエストを `koko.kyara.top` 経由に切替（中国本土ユーザー向け）

- **スクロール対応** — 小さいウィンドウでも縦横スクロールバーが表示される

- **ネイティブ macOS スタイル** — ダークモード・極简 UI、Electron 製

---

## スクリーンショット / Screenshot

> *(ウィンドウは小型化可能、最小限の UI)*
>
> ```
> ┌─────────────────────────────────────────────┐
> │  [Anison.info：音楽→作品 ▼] [進撃の巨人  ] [↵] [ ]CN镜像  │
> ├───────────────┬──────────┬──────────────────┤
> │ 楽曲           │ 分類      │ 作品              │
> ├───────────────┼──────────┼──────────────────┤
> │ 紅蓮の弓矢      │ OP 1 [TV]│ 進撃の巨人         │
> │ 自由の翼        │ OP 2 [TV]│ 進撃の巨人         │
> │ 心臓を捧げよ!   │ OP 3 [TV]│ 進撃の巨人         │
> └───────────────┴──────────┴──────────────────┘
> ```

---

## インストール / Installation

### macOS
1. [Releases](https://github.com/TsukubaKobu/EroMusicSearch/releases) から `EroMusicSearch-x.x.x-arm64.dmg` をダウンロード
2. DMG を開き、アプリをアプリケーションフォルダへドラッグ
3. 初回起動時は右クリック → 開く（Gatekeeper を回避）

### Windows
1. [Releases](https://github.com/TsukubaKobu/EroMusicSearch/releases) から `EroMusicSearch Setup x.x.x.exe` をダウンロード
2. インストーラーを実行してインストール先を指定

---

## 開発 / Development

```bash
# 依存パッケージのインストール
npm install

# 開発モードで起動
npm start

# macOS 向けパッケージのビルド
npm run dist

# Windows 向けパッケージのビルド (クロスコンパイル)
npx electron-builder --win --x64
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop | [Electron](https://www.electronjs.org/) |
| UI | Vanilla HTML / CSS / JavaScript |
| HTML Parsing | [Cheerio](https://cheerio.js.org/) |
| Bangumi | [api.bgm.tv](https://bangumi.github.io/api/) REST API |
| Anison.info | HTML scraping (`n.php` + `program/{id}.html`) |
| ErogameScape | HTML scraping (POST SQL form) |

---

## バージョン履歴 / Changelog

最新の変更履歴は [CHANGELOG.md](./CHANGELOG.md) を参照してください。

| バージョン | 主な変更点 |
|---|---|
| **v1.3.0** | Anison.info を第 3 のデータソースとして追加 |
| **v1.2.0** | 初回検索で結果が出ないバグを修正（セッション競合）|
| **v1.1.0** | CN ミラー対応、Windows ビルド、UI 整理 |
| **v1.0.0** | 初回リリース（ErogameScape + Bangumi）|

---

## ライセンス / License

MIT
