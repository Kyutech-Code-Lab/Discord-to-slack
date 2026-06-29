// Discord にグローバル Slash Command `/announce` を登録するスクリプト。
// CommonJS として実行されるため、import / export / トップレベル await は使わない。
// fetch は Node グローバル、環境変数は process.env から読む。

async function main(): Promise<void> {
  // APP_ENV で test / production を切り替える（env.ts と同じ規則）。
  // test のときは TEST_ 接頭辞付きの変数を読む。
  // ※このスクリプトは CommonJS 制約で import できないため規則を最小限に再実装している。
  const rawAppEnv = (process.env.APP_ENV ?? "").trim().toLowerCase();
  if (rawAppEnv !== "" && rawAppEnv !== "test" && rawAppEnv !== "production") {
    console.error(
      `APP_ENV の値が不正です（test か production を指定してください）。`,
    );
    process.exitCode = 1;
    return;
  }
  const appEnv = rawAppEnv === "test" ? "test" : "production";
  const prefix = appEnv === "test" ? "TEST_" : "";

  // 必要な環境変数を読む（トークンの値はログに出さない）。
  const applicationId = process.env[`${prefix}DISCORD_APPLICATION_ID`];
  const botToken = process.env[`${prefix}DISCORD_BOT_TOKEN`];

  if (!applicationId || !botToken) {
    // どちらが欠けているか分かるように、存在の有無だけ伝える（値は出さない）。
    const missing: string[] = [];
    if (!applicationId) missing.push(`${prefix}DISCORD_APPLICATION_ID`);
    if (!botToken) missing.push(`${prefix}DISCORD_BOT_TOKEN`);
    console.error(
      `環境変数が不足しています: ${missing.join(", ")}。.env.local を確認してください。`,
    );
    process.exitCode = 1;
    return;
  }

  console.log(`対象環境: ${appEnv}`);

  // 登録するコマンド定義（type:1 = CHAT_INPUT、引数なし）。
  const command = {
    name: "announce",
    description: "Slackの各グループへ告知を送ります",
    type: 1,
  };

  const url = `https://discord.com/api/v10/applications/${applicationId}/commands`;

  // Discord API へ POST してコマンドを登録する。
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bot ${botToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });

  if (response.ok) {
    console.log("/announce を登録しました");
    return;
  }

  // 失敗時は HTTP ステータスとレスポンス本文を出す（token は含まない）。
  const errorBody = await response.text();
  console.error(`コマンド登録に失敗しました: HTTP ${response.status} ${response.statusText}`);
  console.error(`レスポンス本文: ${errorBody}`);
  process.exitCode = 1;
}

// エラーを握りつぶさず、失敗時は exitCode を 1 にする。
main().catch((error) => {
  console.error("予期しないエラーが発生しました:", error);
  process.exitCode = 1;
});
