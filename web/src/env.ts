/**
 * 環境変数の読み出しを一箇所に集約する。
 *
 * - 必須の値が無ければ明確なエラーを投げる（握りつぶさない）。
 * - 値そのものはログに出さない（呼び出し側でも秘密情報をログしないこと）。
 * - import 時点で全変数を検証しない（用途ごとに必要な値だけ参照できるよう、
 *   遅延的な getter として提供する）。
 *
 * APP_ENV による test / production 切替:
 * - APP_ENV=test     -> `TEST_` 接頭辞付きの変数を読む（例: TEST_SLACK_BOT_TOKEN）
 * - APP_ENV=production / 未設定 -> 接頭辞なしの変数を読む（本番）
 * - それ以外の値は設定ミスとしてエラーにする（誤って本番へ流れるのを防ぐ）。
 */

export type AppEnv = "test" | "production";

/** 現在の実行対象環境を返す。 */
export function getAppEnv(): AppEnv {
  const raw = (process.env.APP_ENV ?? "").trim().toLowerCase();
  if (raw === "" || raw === "production") return "production";
  if (raw === "test") return "test";
  throw new Error(
    `APP_ENV の値が不正です: "${process.env.APP_ENV}"（test か production を指定してください）`,
  );
}

/** APP_ENV に応じた変数名の接頭辞。 */
function envPrefix(): string {
  return getAppEnv() === "test" ? "TEST_" : "";
}

function required(name: string): string {
  const key = envPrefix() + name;
  const value = process.env[key];
  if (!value || value.trim() === "") {
    throw new Error(`環境変数 ${key} が設定されていません`);
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
