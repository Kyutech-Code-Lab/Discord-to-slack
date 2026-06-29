# 03. あなたがやること（手動作業チェックリスト）

コードでは自動化できない、人手が必要な作業の一覧です。
まず **テスト環境（APP_ENV=test）** で一通り通してから本番へ。

## A. Discord（テスト用アプリ）

- [ ] Discord Developer Portal で**テスト用 Application** を作成
- [ ] 公開鍵・Application ID・Bot Token を取得
- [ ] Bot をテスト用サーバーに参加させる
- [ ] 自分の **Discord ユーザー ID** を控える（許可ユーザーに使う）

## B. Slack（テスト用）

- [ ] テスト用 Slack App を作成し、Bot Token Scope に `chat:write` を付与
- [ ] ワークスペースにインストールして `xoxb-...` トークンを取得
- [ ] **投稿先チャンネルすべてに Bot を招待**（`/invite @bot-name`）
- [ ] 各チャンネルの **Channel ID**（`C...`）を控える
- [ ] 対象メンバーの **Slack User ID**（`U...`）を控える

## C. Google Sheets（テスト用）

- [ ] 参加者シートを作成（列定義は [04-csv-schema.md](./04-csv-schema.md)）
- [ ] 「ウェブに公開」して **CSV の URL** を取得

## D. 環境変数（`web/.env.local`）

- [ ] `APP_ENV=test`
- [ ] `TEST_DISCORD_PUBLIC_KEY` / `TEST_DISCORD_APPLICATION_ID` / `TEST_DISCORD_BOT_TOKEN`
- [ ] `TEST_SLACK_BOT_TOKEN`
- [ ] `TEST_GOOGLE_SHEETS_CSV_URL`
- [ ] `TEST_ALLOWED_DISCORD_USER_IDS`（あなたの Discord ユーザー ID）

## E. コマンド登録と Endpoint 設定

- [ ] `cd web && pnpm register:commands`（`対象環境: test` と表示される）
- [ ] ローカルなら ngrok で公開し、テスト用アプリの **Interactions Endpoint URL** を
      `https://xxxx.ngrok-free.app/api/discord/interactions` に設定
- [ ] Discord 側の Endpoint 検証が通ることを確認

## F. 動作確認（テスト）

- [ ] `/announce` で Modal が開く
- [ ] 確認欄に `SEND` 以外 → 中断される
- [ ] 確認欄に `SEND` → テスト用 Slack チャンネルに投稿される
- [ ] Discord に「成功 N件 / 失敗 M件」が返る
- [ ] 許可していないユーザーで実行 → 拒否される

## G. 本番展開（テストが通ってから）

- [ ] 本番用 Discord / Slack / シートを同様に用意
- [ ] Vercel の Root Directory を `web` に設定
- [ ] Vercel の Environment Variables に**本番値（接頭辞なし）**を設定（`APP_ENV` は `production` か未設定）
- [ ] 本番デプロイ（`vercel --prod`）
- [ ] 本番アプリの Interactions Endpoint URL を本番ドメインに設定
- [ ] `APP_ENV=production` 相当の環境で `pnpm register:commands`（本番アプリへ登録）

## うまくいかないとき

- Endpoint 検証が失敗: 公開鍵が正しいか、URL が `/api/discord/interactions` か
- Slack 投稿が失敗: `chat:write` の有無、Bot がチャンネルに招待済みか、Channel ID は正しいか
- 参加者が対象にならない: `is_active` が `TRUE` か、`slack_user_id` が空でないか、列名が正しいか
