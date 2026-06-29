# セットアップ手順

## 1. Discord Appを作成する

Discord Developer Portalで新しいApplicationを作成します。

取得するもの：

```txt id="sthopq"
DISCORD_APPLICATION_ID
DISCORD_PUBLIC_KEY
DISCORD_BOT_TOKEN
```

## 2. Discord Interactions Endpointを設定する

Vercelにデプロイ後、Discord Developer PortalのInteractions Endpoint URLに以下を設定します。

```txt id="ydvxeo"
https://YOUR_DOMAIN.vercel.app/api/discord/interactions
```

ローカル開発時に検証したい場合は、ngrokなどでローカルサーバーを外部公開して設定します。

例：

```txt id="6m8ntj"
https://xxxxx.ngrok-free.app/api/discord/interactions
```

## 3. Slash Commandを登録する

`.env` を設定した後、以下を実行します。

```bash id="1qx2fx"
pnpm register:commands
```

登録するコマンドは以下のみです。

```txt id="ofm8n6"
/announce
```

このコマンドには引数を持たせません。
実行するとDiscordの入力ダイアログが開きます。

## 4. Slack Appを作成する

Slack APIの管理画面でSlack Appを作成します。

Bot Token Scopesに以下を追加します。

```txt id="ejskoy"
chat:write
```

その後、Slackワークスペースにインストールします。

取得するもの：

```txt id="ikbpso"
SLACK_BOT_TOKEN
```

形式は以下です。

```txt id="ar0gr8"
xoxb-...
```

## 5. Slack Botを各チャンネルに招待する

投稿先となる各Slackグループチャンネルで、Botを招待してください。

```txt id="ljl8dx"
/invite @bot-name
```

Botがチャンネルに入っていない場合、投稿に失敗します。

## 6. Google Sheetsを準備する

Google Sheetsに参加者情報を作成します。

必要な列：

```csv id="kww53b"
group_name,slack_channel_id,participant_name,slack_user_id,is_active
```

例：

```csv id="co5weh"
group_name,slack_channel_id,participant_name,slack_user_id,is_active
team-a,C01234567,山田太郎,U012AAAA,TRUE
team-a,C01234567,佐藤花子,U012BBBB,TRUE
team-b,C07654321,田中次郎,U012CCCC,TRUE
```

`is_active` が `TRUE` の行だけ投稿対象になります。

## 7. Google SheetsをCSVとして公開する

Google SheetsをCSVとして取得できるURLを用意します。

環境変数に設定します。

```env id="5s9dg1"
GOOGLE_SHEETS_CSV_URL=
```

注意：

Google Sheetsを「ウェブに公開」する場合、そのCSV URLを知っている人は内容を閲覧できます。
参加者名を公開したくない場合は、`participant_name` を使わず、以下のように最小構成にしても構いません。

```csv id="0m5d8k"
group_name,slack_channel_id,slack_user_id,is_active
team-a,C01234567,U012AAAA,TRUE
team-a,C01234567,U012BBBB,TRUE
```

その場合は、実装側も `participant_name` を任意列として扱ってください。

## 8. 環境変数を設定する

`.env.local` またはVercelのEnvironment Variablesに設定します。

### test / production の切り替え（APP_ENV）

`APP_ENV` で読み込む変数群を切り替えます。

* `APP_ENV=test` … `TEST_` 接頭辞付きの変数（テスト用 Discord / Slack / シート）を読む
* `APP_ENV=production` または未設定 … 接頭辞なしの変数（本番）を読む
* それ以外の値はエラー（本番への誤送信を防ぐため）

動作確認はまず `APP_ENV=test` で、テスト用の Discord / Slack を使って行ってください。

```env id="sag0tw"
# 実行対象環境
APP_ENV=test

# test 用
TEST_DISCORD_PUBLIC_KEY=
TEST_DISCORD_APPLICATION_ID=
TEST_DISCORD_BOT_TOKEN=
TEST_SLACK_BOT_TOKEN=
TEST_GOOGLE_SHEETS_CSV_URL=
TEST_ALLOWED_DISCORD_USER_IDS=

# production 用
DISCORD_PUBLIC_KEY=
DISCORD_APPLICATION_ID=
DISCORD_BOT_TOKEN=
SLACK_BOT_TOKEN=
GOOGLE_SHEETS_CSV_URL=
ALLOWED_DISCORD_USER_IDS=
```

`ALLOWED_DISCORD_USER_IDS`（および `TEST_ALLOWED_DISCORD_USER_IDS`）はカンマ区切りです。

例：

```env id="7r29k9"
TEST_ALLOWED_DISCORD_USER_IDS=123456789012345678,234567890123456789
```

補足：

* テスト用 Discord アプリは、それぞれ固有の Public Key と Interactions Endpoint URL を持ちます。テスト時は、テスト用アプリの Endpoint をこのデプロイ（ローカルなら ngrok）に向けてください。
* `pnpm register:commands` も `APP_ENV` に従い、test のときはテスト用アプリへ `/announce` を登録します。
* Vercel 本番では `APP_ENV=production`（または未設定）にし、接頭辞なしの変数を設定します。

## 9. ローカルで確認する

依存関係をインストールします。

```bash id="xvj2xw"
pnpm install
```

開発サーバーを起動します。

```bash id="0p37kq"
pnpm dev
```

ビルド確認をします。

```bash id="q0kw0c"
pnpm build
```

## 10. Vercelにデプロイする

Vercelに環境変数を設定した上でデプロイします。

```bash id="q24f0g"
vercel deploy
```

本番デプロイする場合：

```bash id="0vncti"
vercel --prod
```

## 11. 動作確認

Discordで以下を実行します。

```txt id="i54kv4"
/announce
```

確認項目：

* 入力ダイアログが開く
* 告知本文を入力できる
* 確認欄に `SEND` を入力しないと送信されない
* Google Sheets CSVから参加者情報を取得できる
* Slackの各グループチャンネルに投稿される
* Discordに成功/失敗件数が返る

## 12. よくある失敗

### DiscordのEndpoint検証に失敗する

確認すること：

* `DISCORD_PUBLIC_KEY` が正しいか
* リクエスト署名検証を実装しているか
* `PING` に正しく応答しているか
* URLが `/api/discord/interactions` になっているか

### Slack投稿に失敗する

確認すること：

* `SLACK_BOT_TOKEN` が正しいか
* Slack Appに `chat:write` が付いているか
* Botが投稿先チャンネルに招待されているか
* `slack_channel_id` が正しいか

### 参加者が投稿対象にならない

確認すること：

* `is_active` が `TRUE` になっているか
* `slack_user_id` が空ではないか
* CSVの列名が仕様通りか
