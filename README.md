# Video Snapshot App

動画を再生し、任意のタイミングで静止画（JPEG）を切り出して保存・一覧表示できるWebアプリケーションです。

## 技術スタック

### フロントエンド
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- video.js

### バックエンド
- Express.js
- TypeScript
- sharp (画像処理)

## セットアップ

### フロントエンド

```bash
cd frontend
npm install
npm run dev
```

フロントエンドは `http://localhost:3000` で起動します。

### バックエンド

```bash
cd backend
npm install
npm run dev
```

バックエンドは `http://localhost:3001` で起動します。

## 使用方法

1. ヘッダーから動画ファイルをアップロードするか、動画URLを入力して読み込みます
2. 動画が読み込まれたら、任意のタイミングで「Snap」ボタンをクリックします
3. 切り出した静止画はサイドバーに表示されます
4. 各静止画からダウンロードや削除が可能です

## API エンドポイント

- `POST /api/upload-video` - 動画をアップロード
- `POST /api/snapshot` - スナップショットを保存
- `GET /api/video/:videoId/snapshots` - スナップショット一覧を取得
- `DELETE /api/snapshot/:snapshotId` - スナップショットを削除

