1. Discord Appを作成する

Discord Developer Portalで新しいApplicationを作成します。

取得するもの：

DISCORD_APPLICATION_ID
DISCORD_PUBLIC_KEY
DISCORD_BOT_TOKEN
2. Discord Interactions Endpointを設定する

Vercelにデプロイ後、Discord Developer PortalのInteractions Endpoint URLに以下を設定します。

https://YOUR_DOMAIN.vercel.app/api/discord/interactions

ローカル開発時に検証したい場合は、ngrokなどでローカルサーバーを外部公開して設定します。

例：

https://xxxxx.ngrok-free.app/api/discord/interactions
3. Slash Commandを登録する

.env.local を設定した後、以下を実行します。

pnpm register:commands

登録するコマンドは以下のみです。

/announce

このコマンドには引数を持たせません。

実行するとDiscordの入力ダイアログが開きます。

4. Slack Appを作成する

Slack APIの管理画面でSlack Appを作成します。

Bot Token Scopesに以下を追加します。

chat:write

その後、Slackワークスペースにインストールします。

取得するもの：

SLACK_BOT_TOKEN

形式は以下です。

xoxb-...
5. Slack Botを各チャンネルに招待する

投稿先となる各Slackグループチャンネルで、Botを招待してください。

/invite @bot-name

Botがチャンネルに入っていない場合、投稿に失敗します。

6. Google Sheetsを準備する

Google Sheetsに参加者情報を作成します。

必要な列：

group_name,slack_channel_id,participant_name,slack_user_id,is_active

例：

group_name,slack_channel_id,participant_name,slack_user_id,is_active
team-a,C01234567,山田太郎,U012AAAA,TRUE
team-a,C01234567,佐藤花子,U012BBBB,TRUE
team-b,C07654321,田中次郎,U012CCCC,TRUE

is_active が TRUE の行だけ投稿対象になります。

7. Google SheetsをCSVとして公開する

Google SheetsをCSVとして取得できるURLを用意します。

環境変数に設定します。

GOOGLE_SHEETS_CSV_URL=

注意：

Google Sheetsを「ウェブに公開」する場合、そのCSV URLを知っている人は内容を閲覧できます。

参加者名を公開したくない場合は、participant_name を使わず、以下のように最小構成にしても構いません。

group_name,slack_channel_id,slack_user_id,is_active
team-a,C01234567,U012AAAA,TRUE
team-a,C01234567,U012BBBB,TRUE

その場合は、実装側も participant_name を任意列として扱ってください。

8. 環境変数を設定する

.env.local またはVercelのEnvironment Variablesに以下を設定します。

DISCORD_PUBLIC_KEY=
DISCORD_APPLICATION_ID=
DISCORD_BOT_TOKEN=
SLACK_BOT_TOKEN=
GOOGLE_SHEETS_CSV_URL=
ALLOWED_DISCORD_USER_IDS=

ALLOWED_DISCORD_USER_IDS はカンマ区切りです。

例：

ALLOWED_DISCORD_USER_IDS=123456789012345678,234567890123456789
9. ローカルで確認する

依存関係をインストールします。

pnpm install

開発サーバーを起動します。

pnpm dev

ビルド確認をします。

pnpm build
10. Vercelにデプロイする

Vercelに環境変数を設定した上でデプロイします。

vercel deploy

本番デプロイする場合：

vercel --prod

本番デプロイは、ユーザーの明示指示がある場合のみ行ってください。

11. 動作確認

Discordで以下を実行します。

/announce

確認項目：

入力ダイアログが開く
告知本文を入力できる
確認欄に SEND を入力しないと送信されない
Google Sheets CSVから参加者情報を取得できる
Slackの各グループチャンネルに投稿される
Discordに成功/失敗件数が返る
12. よくある失敗
DiscordのEndpoint検証に失敗する

確認すること：

DISCORD_PUBLIC_KEY が正しいか
リクエスト署名検証を実装しているか
PING に正しく応答しているか
URLが /api/discord/interactions になっているか
Slack投稿に失敗する

確認すること：

SLACK_BOT_TOKEN が正しいか
Slack Appに chat:write が付いているか
Botが投稿先チャンネルに招待されているか
slack_channel_id が正しいか
参加者が投稿対象にならない

確認すること：

is_active が TRUE になっているか
slack_user_id が空ではないか
CSVの列名が仕様通りか