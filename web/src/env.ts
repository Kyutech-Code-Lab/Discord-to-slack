/**
 * 環境変数の読み出しを一箇所に集約する。
 *
 * - 必須の値が無ければ明確なエラーを投げる（握りつぶさない）。
 * - 値そのものはログに出さない（呼び出し側でも秘密情報をログしないこと）。
 * - import 時点で全変数を検証しない（用途ごとに必要な値だけ参照できるよう、
 *   遅延的な getter として提供する）。
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(`環境変数 ${name} が設定されていません`);
  }
  return value;
}

/** Discord の公開鍵（署名検証に使用、16進文字列） */
export const getDiscordPublicKey = (): string => required("DISCORD_PUBLIC_KEY");

/** Discord アプリケーションID */
export const getDiscordApplicationId = (): string =>
  required("DISCORD_APPLICATION_ID");

/** Discord Bot トークン */
export const getDiscordBotToken = (): string => required("DISCORD_BOT_TOKEN");

/** Slack Bot トークン（xoxb-...） */
export const getSlackBotToken = (): string => required("SLACK_BOT_TOKEN");

/** 参加者情報の CSV URL */
export const getGoogleSheetsCsvUrl = (): string =>
  required("GOOGLE_SHEETS_CSV_URL");

/** /announce の実行を許可する Discord ユーザーID一覧（カンマ区切り） */
export const getAllowedDiscordUserIds = (): string[] =>
  required("ALLOWED_DISCORD_USER_IDS")
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id !== "");
