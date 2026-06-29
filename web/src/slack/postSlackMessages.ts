import type { SlackMessage } from "@/announcement/buildSlackMessages";

const SLACK_POST_MESSAGE_URL = "https://slack.com/api/chat.postMessage";

export type PostResult = {
  channelId: string;
  ok: boolean;
  error?: string;
};

/**
 * Slack chat.postMessage のレスポンス JSON のうち、本実装が参照する部分。
 * Slack は HTTP 200 でも { ok: false, error: "..." } を返すため、ok を必ず確認する。
 */
type SlackPostMessageResponse = {
  ok: boolean;
  error?: string;
};

/**
 * 単一チャンネルへ chat.postMessage を投げ、成否を PostResult として返す。
 * 例外・HTTP エラー・Slack の ok:false いずれの場合も throw せず、必ず error を記録する。
 *
 * 注意: botToken は Authorization ヘッダ以外で使用しない。error 文字列にもトークンを含めない。
 */
async function postOne(
  message: SlackMessage,
  botToken: string,
): Promise<PostResult> {
  const { channelId } = message;

  try {
    const response = await fetch(SLACK_POST_MESSAGE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${botToken}`,
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({
        channel: channelId,
        text: message.text,
      }),
    });

    if (!response.ok) {
      return {
        channelId,
        ok: false,
        error: `HTTP ${response.status} ${response.statusText}`.trim(),
      };
    }

    const data = (await response.json()) as SlackPostMessageResponse;

    if (data.ok) {
      return { channelId, ok: true };
    }

    return {
      channelId,
      ok: false,
      error: data.error ?? "unknown_error",
    };
  } catch (caught) {
    const reason =
      caught instanceof Error ? caught.message : "unknown network error";
    return { channelId, ok: false, error: reason };
  }
}

/**
 * 各 SlackMessage を対応するチャンネルへ逐次投稿する。
 * - 一斉並列だとチャンネル数が増えたとき Slack のレート制限(HTTP 429)を誘発し
 *   やすいため、1件ずつ順番に投稿してバースト送信を避ける。
 *   （Discord へは deferred 応答済みで、本処理はバックグラウンド実行のため
 *     逐次でも応答遅延の問題はない。）
 * - 1件の失敗は他の投稿を止めない（各々が独立して成否を返す）。
 * - 返り値は入力 messages と同じ順序の PostResult[]。
 */
export async function postSlackMessages(
  messages: SlackMessage[],
  botToken: string,
): Promise<PostResult[]> {
  const results: PostResult[] = [];
  for (const message of messages) {
    results.push(await postOne(message, botToken));
  }
  return results;
}
