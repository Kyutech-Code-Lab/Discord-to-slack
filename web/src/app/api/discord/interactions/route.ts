/**
 * Discord Interactions Endpoint。
 *
 * 役割はオーケストレーションのみ。各責務（署名検証・応答生成・CSV読み込み・
 * メッセージ生成・Slack投稿）は専用モジュールへ委譲する。
 *
 * 処理の流れ:
 *   1. Ed25519 署名検証（失敗なら 401）
 *   2. PING -> PONG
 *   3. /announce コマンド -> 許可ユーザーのみ Modal を表示
 *   4. Modal 送信 -> 許可ユーザー & 確認欄=SEND のときだけ送信
 *      （deferred 応答を返し、Slack投稿は after() でバックグラウンド実行して
 *        結果を元メッセージに反映する）
 */

import { after } from "next/server";

import {
  InteractionType,
  COMMAND_NAME,
  MODAL_CUSTOM_ID,
  FIELD_BODY,
  FIELD_CONFIRM,
  CONFIRM_KEYWORD,
} from "@/discord/constants";
import { verifyDiscordRequest } from "@/discord/verifyDiscordRequest";
import {
  pong,
  announceModal,
  ephemeralMessage,
  deferredEphemeralMessage,
  editOriginalResponse,
} from "@/discord/responses";
import { loadParticipants } from "@/sheets/loadParticipants";
import { buildSlackMessages } from "@/announcement/buildSlackMessages";
import { postSlackMessages } from "@/slack/postSlackMessages";
import {
  getDiscordPublicKey,
  getDiscordApplicationId,
  getSlackBotToken,
  getGoogleSheetsCsvUrl,
  getAllowedDiscordUserIds,
} from "@/env";

// 署名検証・生ボディの取得が必要なため Node ランタイムで動かす。
export const runtime = "nodejs";

/** Discord から受け取る Interaction の必要最小限の形。 */
type InteractionUser = { id?: string };
type ModalComponent = { custom_id?: string; value?: string };
type ActionRowData = { components?: ModalComponent[] };
type Interaction = {
  type: number;
  token: string;
  data?: {
    name?: string;
    custom_id?: string;
    components?: ActionRowData[];
  };
  member?: { user?: InteractionUser };
  user?: InteractionUser;
};

/** ギルド実行は member.user.id、DM 実行は user.id にユーザーが入る。 */
function getUserId(interaction: Interaction): string | undefined {
  return interaction.member?.user?.id ?? interaction.user?.id;
}

/** Modal 送信データから custom_id に対応する入力値を取り出す。 */
function getModalFieldValue(
  interaction: Interaction,
  customId: string,
): string | undefined {
  const rows = interaction.data?.components ?? [];
  for (const row of rows) {
    for (const component of row.components ?? []) {
      if (component.custom_id === customId) {
        return typeof component.value === "string" ? component.value : undefined;
      }
    }
  }
  return undefined;
}

/** 許可された実行者かどうか。 */
function isAllowedUser(userId: string | undefined): boolean {
  if (!userId) return false;
  return getAllowedDiscordUserIds().includes(userId);
}

/** Discord のメッセージ本文上限（約2000文字）。安全側で少し余裕を持たせる。 */
const DISCORD_MESSAGE_MAX = 2000;

/**
 * Discord の本文上限を超えないよう content を切り詰める。
 * 上限超過で editOriginalResponse 自体が失敗し結果が返らなくなるのを防ぐ。
 */
function clampForDiscord(content: string): string {
  if (content.length <= DISCORD_MESSAGE_MAX) return content;
  const ellipsis = "…(省略)";
  return content.slice(0, DISCORD_MESSAGE_MAX - ellipsis.length) + ellipsis;
}

/**
 * Slack へ投稿し、結果を元メッセージへ反映する（バックグラウンド処理）。
 * Discord の 3 秒制限を超えないよう deferred 応答後に実行する。
 */
async function processAnnouncement(
  applicationId: string,
  interactionToken: string,
  body: string,
): Promise<void> {
  try {
    const participants = await loadParticipants(getGoogleSheetsCsvUrl());
    const messages = buildSlackMessages(participants, body);

    if (messages.length === 0) {
      await editOriginalResponse(
        applicationId,
        interactionToken,
        "投稿対象の参加者が見つかりませんでした。",
      );
      return;
    }

    const results = await postSlackMessages(messages, getSlackBotToken());
    const succeeded = results.filter((r) => r.ok);
    const failed = results.filter((r) => !r.ok);

    let content = `投稿完了: 成功 ${succeeded.length}件 / 失敗 ${failed.length}件`;
    if (failed.length > 0) {
      const lines = failed
        .map((f) => `・${f.channelId}: ${f.error ?? "unknown error"}`)
        .join("\n");
      content += `\n失敗したチャンネル:\n${lines}`;
    }

    await editOriginalResponse(
      applicationId,
      interactionToken,
      clampForDiscord(content),
    );
  } catch (error) {
    // 失敗をユーザーへ知らせる。秘密情報は載せない（各モジュールで担保済み）。
    const detail = error instanceof Error ? error.message : "unknown error";
    await editOriginalResponse(
      applicationId,
      interactionToken,
      clampForDiscord(`エラーが発生しました: ${detail}`),
    ).catch(() => {
      // フォローアップ自体に失敗した場合はこれ以上の手段がないため何もしない。
    });
  }
}

export async function POST(request: Request): Promise<Response> {
  // 署名検証には「パース前の生ボディ」が必要。
  const rawBody = await request.text();
  const signature = request.headers.get("x-signature-ed25519");
  const timestamp = request.headers.get("x-signature-timestamp");

  const isValid = await verifyDiscordRequest({
    rawBody,
    signature,
    timestamp,
    publicKey: getDiscordPublicKey(),
  });
  if (!isValid) {
    return new Response("invalid request signature", { status: 401 });
  }

  // 署名は正しくても本文が壊れている場合は 400 を返す（500 で
  // 「Interaction failed」になるのを避ける）。
  let interaction: Interaction;
  try {
    interaction = JSON.parse(rawBody) as Interaction;
  } catch {
    return new Response("invalid request body", { status: 400 });
  }

  // 1. PING -> PONG（Endpoint 検証）
  if (interaction.type === InteractionType.PING) {
    return Response.json(pong());
  }

  // 2. /announce コマンド -> 許可ユーザーに Modal を表示
  if (interaction.type === InteractionType.APPLICATION_COMMAND) {
    if (interaction.data?.name !== COMMAND_NAME) {
      return new Response("unknown command", { status: 400 });
    }
    if (!isAllowedUser(getUserId(interaction))) {
      return Response.json(
        ephemeralMessage("このコマンドを実行する権限がありません。"),
      );
    }
    return Response.json(announceModal());
  }

  // 3. Modal 送信 -> 検証して Slack 投稿
  if (interaction.type === InteractionType.MODAL_SUBMIT) {
    if (interaction.data?.custom_id !== MODAL_CUSTOM_ID) {
      return new Response("unknown modal", { status: 400 });
    }

    // 念のため Modal 送信時も実行者を再確認する。
    if (!isAllowedUser(getUserId(interaction))) {
      return Response.json(
        ephemeralMessage("このコマンドを実行する権限がありません。"),
      );
    }

    const confirmation = getModalFieldValue(interaction, FIELD_CONFIRM);
    if (confirmation?.trim() !== CONFIRM_KEYWORD) {
      return Response.json(
        ephemeralMessage(
          `確認欄に ${CONFIRM_KEYWORD} と入力されていないため、送信を中断しました。`,
        ),
      );
    }

    const body = getModalFieldValue(interaction, FIELD_BODY);
    if (!body || body.trim() === "") {
      return Response.json(ephemeralMessage("告知本文が空のため中断しました。"));
    }

    // ここで applicationId / token を確定させ、バックグラウンド処理へ渡す。
    const applicationId = getDiscordApplicationId();
    const interactionToken = interaction.token;
    after(() => processAnnouncement(applicationId, interactionToken, body));

    return Response.json(deferredEphemeralMessage());
  }

  // 想定外の Interaction 種別。
  return new Response("unsupported interaction type", { status: 400 });
}
