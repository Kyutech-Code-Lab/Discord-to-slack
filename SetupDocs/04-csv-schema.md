# 04. CSV スキーマ（参加者シートの列定義）

`GOOGLE_SHEETS_CSV_URL` で公開する参加者シートの仕様です。
**1行目はヘッダ**で、列は**順序ではなく列名で対応付け**ます。

## 雛形（コピーして使う）

- フル版: [`participants-template.csv`](./participants-template.csv)
- 最小版（名前なし）: [`participants-template-minimal.csv`](./participants-template-minimal.csv)

Google Sheets に貼り付け、値を実際の Channel ID / User ID に差し替えてください。
（雛形の最終行は `is_active=FALSE`＝除外される例です。）

## 列定義

| 列名 | 必須 | 意味 | 例 |
| --- | --- | --- | --- |
| `group_name` | 必須 | グループ名（人が見るための識別子） | `team-a` |
| `slack_channel_id` | 必須 | 投稿先の Slack チャンネル ID | `C01234567` |
| `participant_name` | 任意 | 参加者名（無くてもよい） | `山田太郎` |
| `slack_user_id` | 必須 | メンションする Slack ユーザー ID | `U012AAAA` |
| `is_active` | 必須 | `TRUE` の行だけ投稿対象 | `TRUE` |

> `participant_name` は任意列です。個人名を公開したくない場合は列ごと省略できます。

## 例（フル）

```csv
group_name,slack_channel_id,participant_name,slack_user_id,is_active
team-a,C01234567,山田太郎,U012AAAA,TRUE
team-a,C01234567,佐藤花子,U012BBBB,TRUE
team-b,C07654321,田中次郎,U012CCCC,TRUE
```

## 例（最小・名前なし）

```csv
group_name,slack_channel_id,slack_user_id,is_active
team-a,C01234567,U012AAAA,TRUE
team-a,C01234567,U012BBBB,TRUE
```

## 取り込みルール（実装挙動）

- `is_active` が **`TRUE`**（前後空白を除き大文字小文字を区別しない）の行だけ対象。
  それ以外（`FALSE`・空など）は除外。
- `slack_channel_id` または `slack_user_id` が**空の行はスキップ**。
- 空行はスキップ。各値は前後の空白を除去。
- `participant_name` 列が無い／空なら、その参加者は名前なしとして扱う。
- 必須列（`group_name` / `slack_channel_id` / `slack_user_id` / `is_active`）が
  ヘッダに無い場合はエラー（どの列が無いか表示）。
- 値にカンマを含む場合はダブルクォートで囲む（`"佐藤, 花子"`）。CSV の引用・改行・`""` エスケープに対応。

## グループ化と投稿の関係

- 投稿は **`slack_channel_id` 単位**でまとまる（同じチャンネルの対象者は1メッセージに集約）。
- 同一チャンネル内で同じ `slack_user_id` が重複しても**1回だけ**メンション（順序は維持）。
- メッセージのメンション行は登場順。

## ID の調べ方（補足）

- Slack の Channel ID（`C...`）/ User ID（`U...`）は、対象のチャンネルやプロフィールの
  「リンクをコピー」やプロフィール詳細から確認できます。
- 表示名ではなく **ID** を使う点に注意（表示名はメンションに使えません）。

## 注意（プライバシー）

- Google Sheets を「ウェブに公開」すると、URL を知っている人が内容を閲覧できます。
- 個人名を載せたくない場合は `participant_name` を省略してください。
