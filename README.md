KCL Slack Announcer

DiscordからSlackへ告知を送るための最小ツールです。

できること

Discordで /announce を実行すると入力ダイアログが開きます。

入力した本文を、Slackの各グループチャンネルへ個人メンション付きで投稿します。

使い方

Discordで以下を実行します。

/announce

表示された入力ダイアログに以下を入力します。

告知本文
確認欄に SEND

送信すると、全Slackグループチャンネルに投稿されます。

投稿例
<@U012AAAA> <@U012BBBB>

今日中に各チームでアプリ案を決めてください！
技術構成
Next.js App Router
TypeScript
Vercel Functions
Discord Interactions Endpoint
Slack Web API
Google Sheets CSV
ドキュメント

開発者向けの詳細は以下を参照してください。

AGENT.md
docs/SPEC.md
docs/SETUP.md
開発
pnpm install
pnpm dev
ビルド
pnpm build
Slash Command登録
pnpm register:commands
環境変数
DISCORD_PUBLIC_KEY=
DISCORD_APPLICATION_ID=
DISCORD_BOT_TOKEN=
SLACK_BOT_TOKEN=
GOOGLE_SHEETS_CSV_URL=
ALLOWED_DISCORD_USER_IDS=
.env.example
DISCORD_PUBLIC_KEY=
DISCORD_APPLICATION_ID=
DISCORD_BOT_TOKEN=
SLACK_BOT_TOKEN=
GOOGLE_SHEETS_CSV_URL=
ALLOWED_DISCORD_USER_IDS=