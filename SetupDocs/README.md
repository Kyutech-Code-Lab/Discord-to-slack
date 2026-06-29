# SetupDocs

Discord `/announce` → Slack 告知ツールの **運営者向けセットアップ資料**です。
実装の実挙動に合わせてまとめています。

## 目次

1. [仕様（何が起きるか）](./01-spec.md)
2. [セッティング（環境変数・各サービス設定）](./02-settings.md)
3. [あなたがやること（手動作業チェックリスト）](./03-your-tasks.md)
4. [CSV スキーマ（参加者シートの列定義）](./04-csv-schema.md)

## 全体像

```
Discord /announce
  → Modal（告知本文 + 確認欄）
  → 確認欄が "SEND" のときだけ実行
  → Google Sheets CSV から is_active=TRUE の参加者を取得
  → Slack チャンネルごとにメンションをまとめて chat.postMessage
  → 成功/失敗件数を Discord（本人のみ表示）へ返す
```

- 常駐 Bot / DB / 管理画面なし（Vercel Functions 上の Interactions Endpoint のみ）
- Endpoint: `POST /api/discord/interactions`
- 実装本体は [`../web`](../web)、開発者向け詳細は [`../docs/SPEC.md`](../docs/SPEC.md) / [`../docs/SETUP.md`](../docs/SETUP.md)
