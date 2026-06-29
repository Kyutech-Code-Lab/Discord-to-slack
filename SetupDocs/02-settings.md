# 02. セッティング（環境変数・各サービス設定）

## 環境変数

`web/.env.local`（ローカル）または Vercel の Environment Variables に設定します。
テンプレートは [`../web/.env.example`](../web/.env.example)。

### APP_ENV による test / production 切替

| `APP_ENV` | 読む変数 | 用途 |
| --- | --- | --- |
| `test` | `TEST_` 接頭辞付き | テスト用 Discord / Slack / シートで動作確認 |
| `production` または未設定 | 接頭辞なし | 本番 |
| それ以外の値 | （エラー） | 本番への誤送信を防ぐため弾く |

動作確認はまず `APP_ENV=test` で行ってください。

### 変数一覧

| 本番（接頭辞なし） | test 用 | 用途 |
| --- | --- | --- |
| `DISCORD_PUBLIC_KEY` | `TEST_DISCORD_PUBLIC_KEY` | 署名検証に使う公開鍵 |
| `DISCORD_APPLICATION_ID` | `TEST_DISCORD_APPLICATION_ID` | アプリケーション ID |
| `DISCORD_BOT_TOKEN` | `TEST_DISCORD_BOT_TOKEN` | コマンド登録に使う Bot トークン |
| `SLACK_BOT_TOKEN` | `TEST_SLACK_BOT_TOKEN` | Slack Bot トークン（`xoxb-...`） |
| `GOOGLE_SHEETS_CSV_URL` | `TEST_GOOGLE_SHEETS_CSV_URL` | 参加者情報の CSV URL |
| `ALLOWED_DISCORD_USER_IDS` | `TEST_ALLOWED_DISCORD_USER_IDS` | 実行を許可するユーザー ID（カンマ区切り） |

`ALLOWED_DISCORD_USER_IDS` の例: `123456789012345678,234567890123456789`

## Discord 側の設定

- Discord Developer Portal で Application を作成。
  - `DISCORD_PUBLIC_KEY` / `DISCORD_APPLICATION_ID` / `DISCORD_BOT_TOKEN` を取得。
- **Interactions Endpoint URL** を設定:
  - 本番: `https://YOUR_DOMAIN.vercel.app/api/discord/interactions`
  - ローカル検証: ngrok 等で公開した `https://xxxx.ngrok-free.app/api/discord/interactions`
- `/announce` の登録:
  ```bash
  cd web
  pnpm register:commands   # APP_ENV に従い test/本番のアプリへ登録
  ```
  - `register:commands` は Node が `.ts` を直接実行するため **Node 22.18+ / 23.6+** が必要。
- ※テスト用と本番用の Discord アプリは**それぞれ固有の公開鍵と Endpoint URL** を持つ。
  テスト時はテスト用アプリの Endpoint をこのデプロイ（ローカルは ngrok）に向ける。

## Slack 側の設定

- Slack App を作成し、Bot Token Scopes に **`chat:write`** を追加。
- ワークスペースにインストールして `SLACK_BOT_TOKEN`（`xoxb-...`）を取得。
- **投稿先の各チャンネルに Bot を招待**（`/invite @bot-name`）。未招待だと投稿失敗。

## Google Sheets 側の設定

- 参加者シートを用意（列定義は [04-csv-schema.md](./04-csv-schema.md)）。
- 「ウェブに公開」して CSV として取得できる URL を `GOOGLE_SHEETS_CSV_URL` に設定。
- 公開 URL は知っている人が閲覧できる点に注意（個人情報の扱いに留意）。

## Vercel（デプロイ）

- プロジェクトの **Root Directory を `web`** に設定。
- Environment Variables に本番値（接頭辞なし、`APP_ENV=production` か未設定）を設定。
- デプロイ:
  ```bash
  vercel deploy        # プレビュー
  vercel --prod        # 本番（明示指示があるときのみ）
  ```

## ローカル開発

```bash
cd web
pnpm install
pnpm dev      # 開発サーバー
pnpm build    # 本番ビルド確認
```
