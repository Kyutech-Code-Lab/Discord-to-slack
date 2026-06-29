/**
 * Discord Interactions の「応答オブジェクト」を生成する純粋関数群と、
 * deferred 応答後に元メッセージを編集する関数を提供する。
 */

import {
  InteractionResponseType,
  ComponentType,
  TextInputStyle,
  MessageFlags,
  MODAL_CUSTOM_ID,
  FIELD_BODY,
  FIELD_CONFIRM,
  CONFIRM_KEYWORD,
  DISCORD_API_BASE,
} from "@/discord/constants";

/** PING への応答。 */
type PongResponse = {
  type: typeof InteractionResponseType.PONG;
};

/** Text Input コンポーネント。 */
type TextInputComponent = {
  type: typeof ComponentType.TEXT_INPUT;
  custom_id: string;
  style: (typeof TextInputStyle)[keyof typeof TextInputStyle];
  label: string;
  required: boolean;
  placeholder?: string;
  max_length?: number;
};

/** Action Row（コンポーネントの行）。 */
type ActionRow = {
  type: typeof ComponentType.ACTION_ROW;
  components: TextInputComponent[];
};

/** Modal 応答。 */
type ModalResponse = {
  type: typeof InteractionResponseType.MODAL;
  data: {
    custom_id: string;
    title: string;
    components: ActionRow[];
  };
};

/** 本人にのみ見える通常メッセージ応答。 */
type EphemeralMessageResponse = {
  type: typeof InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE;
  data: {
    content: string;
    flags: typeof MessageFlags.EPHEMERAL;
  };
};

/** 遅延応答。後から元メッセージを書き込む。 */
type DeferredEphemeralMessageResponse = {
  type: typeof InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE;
  data: {
    flags: typeof MessageFlags.EPHEMERAL;
  };
};

/** PING への応答オブジェクトを返す。 */
export function pong(): PongResponse {
  return { type: InteractionResponseType.PONG };
}

/** /announce 実行時に表示する Modal の応答オブジェクトを返す。 */
export function announceModal(): ModalResponse {
  return {
    type: InteractionResponseType.MODAL,
    data: {
      custom_id: MODAL_CUSTOM_ID,
      title: "告知を送信",
      components: [
        // 1行目: 告知本文（複数行入力）
        {
          type: ComponentType.ACTION_ROW,
          components: [
            {
              type: ComponentType.TEXT_INPUT,
              custom_id: FIELD_BODY,
              style: TextInputStyle.PARAGRAPH,
              label: "告知本文",
              required: true,
            },
          ],
        },
        // 2行目: 確認欄（SEND と入力で送信）
        {
          type: ComponentType.ACTION_ROW,
          components: [
            {
              type: ComponentType.TEXT_INPUT,
              custom_id: FIELD_CONFIRM,
              style: TextInputStyle.SHORT,
              label: `確認 (${CONFIRM_KEYWORD} と入力すると送信)`,
              required: true,
              placeholder: CONFIRM_KEYWORD,
              max_length: 10,
            },
          ],
        },
      ],
    },
  };
}

/** 本人にのみ見える通常メッセージ応答を返す。 */
export function ephemeralMessage(content: string): EphemeralMessageResponse {
  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      content,
      flags: MessageFlags.EPHEMERAL,
    },
  };
}

/** 後で結果を書き込むための遅延応答を返す。 */
export function deferredEphemeralMessage(): DeferredEphemeralMessageResponse {
  return {
    type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      flags: MessageFlags.EPHEMERAL,
    },
  };
}

/**
 * deferred 応答後に元メッセージ本文を content で更新する。
 * interaction token が認証を兼ねるため Authorization ヘッダは不要。
 * 失敗時は Error を throw する（token はエラーに含めない）。
 */
export async function editOriginalResponse(
  applicationId: string,
  interactionToken: string,
  content: string,
): Promise<void> {
  const url = `${DISCORD_API_BASE}/webhooks/${applicationId}/${interactionToken}/messages/@original`;

  const response = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    // token を含めないよう、ステータス情報のみを使う。
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Failed to edit original interaction response: ${response.status} ${response.statusText}${
        detail ? ` - ${detail}` : ""
      }`,
    );
  }
}
