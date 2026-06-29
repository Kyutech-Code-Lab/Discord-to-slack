/**
 * Discord Interactions API の定数。
 * 数値は Discord 公式ドキュメントの定義に合わせる。
 */

/** Interaction Type (Discord -> 本アプリ) */
export const InteractionType = {
  PING: 1,
  APPLICATION_COMMAND: 2,
  MESSAGE_COMPONENT: 3,
  APPLICATION_COMMAND_AUTOCOMPLETE: 4,
  MODAL_SUBMIT: 5,
} as const;

/** Interaction Response Type (本アプリ -> Discord) */
export const InteractionResponseType = {
  PONG: 1,
  CHANNEL_MESSAGE_WITH_SOURCE: 4,
  DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE: 5,
  DEFERRED_UPDATE_MESSAGE: 6,
  UPDATE_MESSAGE: 7,
  MODAL: 9,
} as const;

/** Message Component Type */
export const ComponentType = {
  ACTION_ROW: 1,
  TEXT_INPUT: 4,
} as const;

/** Text Input Style */
export const TextInputStyle = {
  SHORT: 1,
  PARAGRAPH: 2,
} as const;

/** Message Flags */
export const MessageFlags = {
  /** 本人にのみ見えるメッセージ */
  EPHEMERAL: 64,
} as const;

/** Slash Command 名 */
export const COMMAND_NAME = "announce";

/** Modal の custom_id */
export const MODAL_CUSTOM_ID = "announce_modal";

/** Modal 内の入力フィールド custom_id */
export const FIELD_BODY = "announcement_body";
export const FIELD_CONFIRM = "confirmation";

/** 確認欄に入力されるべきキーワード。これ以外なら送信を中断する。 */
export const CONFIRM_KEYWORD = "SEND";

/** Discord REST API のベースURL */
export const DISCORD_API_BASE = "https://discord.com/api/v10";
