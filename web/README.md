# KCL Slack Announcer (web)

Discord の `/announce` から Slack の各グループチャンネルへ、個人メンション付きで告知を送る最小ツールの実装本体です（Next.js App Router / Vercel Functions）。

リポジトリ全体の概要は親ディレクトリの [`../README.md`](../README.md)、詳細仕様・手順は [`../docs/SPEC.md`](../docs/SPEC.md) / [`../docs/SETUP.md`](../docs/SETUP.md) を参照してください。

## 動作の流れ

1. Discord で `/announce` を実行すると Modal（入力ダイアログ）が開く
2. 「告知本文」と「確認欄」を入力して送信
3. 確認欄が `SEND` でない場合は中断
4. 許可された Discord ユーザーのみ実行可能
5. Google Sheets CSV から `is_active=TRUE` の参加者を取得
6. チャンネルごとにメンションをまとめたメッセージを生成
7. Slack `chat.postMessage` で各チャンネルへ投稿
8. 成功 / 失敗の件数を Discord（本人のみ表示）へ返す

> Slack 投稿は Discord の 3 秒応答制限を超えうるため、まず deferred 応答を返し、`after()` でバックグラウンド投稿してから元メッセージを結果で更新します。

## ディレクトリ構成

```
src/app/api/discord/interactions/route.ts  Interactions Endpoint（オーケストレーション）
src/discord/verifyDiscordRequest.ts        Ed25519 署名検証（WebCrypto, 依存追加なし）
src/discord/responses.ts                   Discord 応答生成 + followup 送信
src/discord/constants.ts                   Interaction/Response 定数
src/sheets/loadParticipants.ts             Google Sheets CSV 取得・パース
src/announcement/buildSlackMessages.ts     チャンネル別メンション生成
src/slack/postSlackMessages.ts             Slack chat.postMessage 投稿
src/env.ts                                 環境変数アクセス
scripts/register-commands.ts               /announce 登録スクリプト
```

## セットアップ

```bash
pnpm install
cp .env.example .env.local   # 値を埋める
```

### 環境変数（`.env.local`）

`APP_ENV` で test / production を切り替えます。

- `APP_ENV=test` … `TEST_` 接頭辞付きの変数（テスト用 Discord / Slack / シート）を読む
- `APP_ENV=production` または未設定 … 接頭辞なしの変数（本番）を読む
- それ以外の値はエラー（本番への誤送信防止）

動作確認はまず `APP_ENV=test` で行ってください。`pnpm register:commands` も `APP_ENV` に従います。

| 変数（本番） | test 用 | 用途 |
| --- | --- | --- |
| `DISCORD_PUBLIC_KEY` | `TEST_DISCORD_PUBLIC_KEY` | 署名検証に使う公開鍵 |
| `DISCORD_APPLICATION_ID` | `TEST_DISCORD_APPLICATION_ID` | アプリケーション ID |
| `DISCORD_BOT_TOKEN` | `TEST_DISCORD_BOT_TOKEN` | コマンド登録に使う Bot トークン |
| `SLACK_BOT_TOKEN` | `TEST_SLACK_BOT_TOKEN` | Slack Bot トークン（`xoxb-...`、要 `chat:write`） |
| `GOOGLE_SHEETS_CSV_URL` | `TEST_GOOGLE_SHEETS_CSV_URL` | 参加者情報の CSV URL |
| `ALLOWED_DISCORD_USER_IDS` | `TEST_ALLOWED_DISCORD_USER_IDS` | 実行を許可するユーザー ID（カンマ区切り） |

## コマンド

```bash
pnpm dev               # 開発サーバー
pnpm build             # 本番ビルド
pnpm register:commands # /announce を Discord に登録（.env.local が必要）
```

> `register:commands` は Node が `.ts` を直接実行します。型ストリッピングが既定で有効な **Node 22.18+ / 23.6+** が必要です（`package.json` の `engines` に明記）。

## CSV 列定義

```csv
group_name,slack_channel_id,participant_name,slack_user_id,is_active
team-a,C01234567,山田太郎,U012AAAA,TRUE
team-a,C01234567,佐藤花子,U012BBBB,TRUE
team-b,C07654321,田中次郎,U012CCCC,TRUE
```

- `is_active` が `TRUE` の行だけが投稿対象
- `participant_name` は任意列（無くても動作）
- `slack_channel_id` / `slack_user_id` が空の行はスキップ

## Interactions Endpoint URL

```
https://YOUR_DOMAIN.vercel.app/api/discord/interactions
```

Vercel へデプロイする場合、Root Directory は `web` を指定してください。
