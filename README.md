# キャディラック祭り 2026 — 公式サイト

2026年10月11日（日）仙台・国分町 VORZ BAR で開催の「キャディラック祭り 2026」のサイトです。

- **トップ**：日時・会場・フライヤー
- **概要**：イベント紹介、日程、時間、会場、料金
- **出演**：8バンド。バンド名をタップすると演奏曲が開きます
- **掲示板**：誰でも書き込めます（Cloudflareで公開したときだけ表示）
- **アクセス**・**協賛**

## フォルダ構成

```
docs/              サイト本体（このフォルダが公開されます）
  index.html       ページの中身 ← 文章・出演・演奏曲はここを書き換え
  style.css        デザイン（先頭の色の設定でまとめて色を変えられます）
  app.js           掲示板の動き
  flyer.jpg        フライヤー画像
  ogp.jpg          SNSでURLを共有したときのサムネイル
  admin.html / admin.js   掲示板の書き込みを削除する管理画面
functions/api/     掲示板のサーバー側の処理（Cloudflare用）
lib/http.js        共通の小さな関数（Cloudflare用）
schema.sql         掲示板のデータベースの表（Cloudflare用）
wrangler.toml      Cloudflareの設定
```

## 公開のしかた（どちらか一方を選ぶ）

### A. GitHub Pages だけで公開する（いちばん簡単・掲示板なし）

1. GitHubで新しいリポジトリを作成（**Public** にする。無料プランのGitHub PagesはPublicのみ）
2. 「uploading an existing file」から、このフォルダの中身をすべてドラッグ＆ドロップして Commit
3. リポジトリの **Settings → Pages** を開く
4. Source を「Deploy from a branch」、Branch を `main`、フォルダを **`/docs`** にして Save
5. 数分で `https://（ユーザー名）.github.io/（リポジトリ名）/` に公開されます

この方法では掲示板の欄は自動的に表示されません（サーバー機能がないため）。

### B. GitHub ＋ Cloudflare Pages で公開する（掲示板あり・無料枠で運用可）

1. 上のAの手順1〜2と同じく、GitHubにアップロード（Privateでも可）
2. Cloudflareにログイン → **ストレージとデータベース → D1** → **データベースを作成**（名前は `live-event-db`）
3. 作成後に表示される **データベースID** をコピーし、GitHub上で `wrangler.toml` の `database_id` をそのIDに書き換えて Commit
4. D1の **コンソール** タブで `schema.sql` の中身を貼り付けて実行
5. **Workers & Pages → 作成 → Pages → Gitに接続** → リポジトリを選ぶ
6. ビルド設定：フレームワーク「なし」、ビルドコマンドは空欄、出力ディレクトリは **`docs`** → 保存してデプロイ
7. 管理画面の合言葉：Pagesプロジェクトの **設定 → 変数とシークレット** で、シークレット `ADMIN_TOKEN` に推測されにくい文字列を登録 → 最新のデプロイを「再試行」
8. `https://○○.pages.dev/admin.html` を開き、合言葉を入れると書き込みを削除できます

どちらの方法でも、以降はGitHubでファイルを書き換えるたびに自動でサイトに反映されます。

## よくある変更

| やりたいこと | 場所 |
| --- | --- |
| 料金・お問い合わせ先 | `docs/index.html` の「（料金をここに記入）」「（連絡先をここに記入）」 |
| 出演バンド・演奏曲 | `docs/index.html` の出演欄（`<summary>` がバンド名、その下の `<li>` が曲名） |
| 紹介文 | `docs/index.html` の概要欄 |
| 色 | `docs/style.css` の先頭（`--pink`、`--teal` など） |
| フライヤー | `docs/flyer.jpg` を同じ名前で差し替え |
