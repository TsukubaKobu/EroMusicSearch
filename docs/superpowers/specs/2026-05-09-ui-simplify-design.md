# UI 簡潔化設計

## 1. 検索モード分割
- データソース：3 選択ドロップダウン (EGS / Bangumi / Anison)
- 検索方向：トグルボタン（クリックで作品→音楽 ⇔ 音楽→作品を切替）
- CN ミラー：チェックボックス（EGS 選択時のみ表示、ラベル短縮「镜像」）

## 2. 設定メニュー簡素化
- 保持：検索既定値（ソース・方向・ミラー）、キャッシュ削除
- 削除：フォントサイズ（固定 12px）、ウィンドウサイズ

## 3. CNミラー位置調整
- 検索バー右端に配置（既存位置維持）、ラベル「CN镜像」→「镜像」

## 4. ステータス表示統合
- #loader / #errorBox / #noResults / #cacheIndicator → #statusBar
- 常に占位、内容と色のみ切替

## 5. 間隔・フォントサイズ微調整
- ベース font-size: 12px
- container padding: 0 8px 8px
- search-bar gap: 4px, margin-bottom: 6px
- input padding: 4px 8px
- th/td padding: 4px 8px
- settings-menu min-width: 200px
