import type { Participant } from "@/sheets/loadParticipants";

export type SlackMessage = {
  channelId: string;
  text: string;
};

/**
 * チャンネルごとにグループ化した参加者の中間表現。
 * 出現順を保つため、Map のキー挿入順に依存する。
 */
type ChannelGroup = {
  channelId: string;
  userIds: string[];
};

/**
 * participants を slackChannelId ごとにグループ化する。
 * - チャンネルの出現順、各チャンネル内の参加者の登場順を維持する。
 * - slackChannelId が空のものはスキップ。
 * - 同一チャンネル内で重複する slackUserId は順序を維持しつつ1つにまとめる。
 * - slackUserId が空のものはスキップ。
 */
function groupParticipantsByChannel(participants: Participant[]): ChannelGroup[] {
  const groups = new Map<string, ChannelGroup>();
  // 重複判定は配列の includes だと O(n^2) になるため、
  // 順序は userIds 配列で保ちつつ、membership 判定は Set で O(1) にする。
  const seenByChannel = new Map<string, Set<string>>();

  for (const participant of participants) {
    const channelId = participant.slackChannelId?.trim();
    const userId = participant.slackUserId?.trim();

    if (!channelId || !userId) {
      continue;
    }

    let group = groups.get(channelId);
    let seen = seenByChannel.get(channelId);
    if (!group || !seen) {
      group = { channelId, userIds: [] };
      seen = new Set<string>();
      groups.set(channelId, group);
      seenByChannel.set(channelId, seen);
    }

    if (!seen.has(userId)) {
      seen.add(userId);
      group.userIds.push(userId);
    }
  }

  return Array.from(groups.values());
}

/**
 * slackUserId の配列を Slack メンション文字列に変換する。
 * 例: ["U012AAAA", "U012BBBB"] -> "<@U012AAAA> <@U012BBBB>"
 */
function buildMentions(userIds: string[]): string {
  return userIds.map((userId) => `<@${userId}>`).join(" ");
}

/**
 * メンション行と告知本文を組み立てる。
 * 形式:
 *   <@U012AAAA> <@U012BBBB>
 *   (空行)
 *   {告知本文}
 */
function buildMessageText(userIds: string[], body: string): string {
  const mentions = buildMentions(userIds);
  return `${mentions}\n\n${body}`;
}

/**
 * 参加者リストと告知本文から、Slack チャンネルごとの投稿メッセージを生成する純粋関数。
 * チャンネル単位でメンションをまとめる。
 */
export function buildSlackMessages(
  participants: Participant[],
  body: string,
): SlackMessage[] {
  const trimmedBody = body.trim();
  const groups = groupParticipantsByChannel(participants);

  return groups
    .filter((group) => group.userIds.length > 0)
    .map((group) => ({
      channelId: group.channelId,
      text: buildMessageText(group.userIds, trimmedBody),
    }));
}
