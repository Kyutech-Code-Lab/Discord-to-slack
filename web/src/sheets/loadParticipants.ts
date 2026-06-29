export type Participant = {
  groupName: string;
  slackChannelId: string;
  participantName?: string; // participant_name 列が無い/空なら undefined
  slackUserId: string;
  isActive: boolean;
};

const REQUIRED_COLUMNS = [
  "group_name",
  "slack_channel_id",
  "slack_user_id",
  "is_active",
] as const;

/**
 * 簡易だが正しい CSV パーサ。
 * - ダブルクォートで囲まれたフィールド
 * - フィールド内のカンマ・改行
 * - `""` によるエスケープ（クォート内のダブルクォート）
 * - CRLF / LF / CR の改行
 * 戻り値は行 -> フィールドの二次元配列。
 */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;
  const len = text.length;

  const endField = (): void => {
    row.push(field);
    field = "";
  };
  const endRow = (): void => {
    endField();
    rows.push(row);
    row = [];
  };

  while (i < len) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          // エスケープされたダブルクォート
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += ch;
      i += 1;
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (ch === ",") {
      endField();
      i += 1;
      continue;
    }
    if (ch === "\r") {
      // CRLF または CR
      if (text[i + 1] === "\n") {
        i += 2;
      } else {
        i += 1;
      }
      endRow();
      continue;
    }
    if (ch === "\n") {
      i += 1;
      endRow();
      continue;
    }

    field += ch;
    i += 1;
  }

  // 末尾の行を確定（空文字で終わる場合は末尾の空行を作らない）
  if (field !== "" || row.length > 0) {
    endRow();
  }

  return rows;
}

/**
 * ヘッダ行から「列名 -> インデックス」のマップを作る。
 * 必須列が欠けていれば Error を throw する。
 */
function buildHeaderMap(header: string[]): Map<string, number> {
  const map = new Map<string, number>();
  header.forEach((name, index) => {
    const key = name.trim();
    if (!map.has(key)) {
      map.set(key, index);
    }
  });

  const missing = REQUIRED_COLUMNS.filter((col) => !map.has(col));
  if (missing.length > 0) {
    throw new Error(`必須列が見つかりません: ${missing.join(", ")}`);
  }

  return map;
}

function getCell(row: string[], index: number | undefined): string {
  if (index === undefined) {
    return "";
  }
  const value = row[index];
  return value === undefined ? "" : value.trim();
}

/**
 * 1 データ行を Participant に変換する。
 * 対象外（is_active が TRUE でない、必須値が空、空行など）の場合は null を返す。
 */
function rowToParticipant(
  row: string[],
  header: Map<string, number>,
): Participant | null {
  // 空行スキップ（全フィールドが空）
  if (row.every((cell) => cell.trim() === "")) {
    return null;
  }

  const isActiveRaw = getCell(row, header.get("is_active"));
  const isActive = isActiveRaw.toLowerCase() === "true";
  if (!isActive) {
    return null;
  }

  const slackChannelId = getCell(row, header.get("slack_channel_id"));
  const slackUserId = getCell(row, header.get("slack_user_id"));
  if (slackChannelId === "" || slackUserId === "") {
    return null;
  }

  const groupName = getCell(row, header.get("group_name"));
  const participantNameRaw = getCell(row, header.get("participant_name"));

  const participant: Participant = {
    groupName,
    slackChannelId,
    slackUserId,
    isActive: true,
  };
  if (participantNameRaw !== "") {
    participant.participantName = participantNameRaw;
  }

  return participant;
}

/**
 * Google Sheets を「ウェブに公開」した CSV URL から参加者情報を取得・パースして返す。
 * 対象行（is_active が TRUE かつ必須値が揃う行）のみを返す。
 */
export async function loadParticipants(csvUrl: string): Promise<Participant[]> {
  const res = await fetch(csvUrl);
  if (!res.ok) {
    throw new Error(`CSVの取得に失敗しました: status ${res.status}`);
  }

  const text = await res.text();
  const rows = parseCsv(text);
  if (rows.length === 0) {
    return [];
  }

  const [header, ...dataRows] = rows;
  const headerMap = buildHeaderMap(header);

  const participants: Participant[] = [];
  for (const row of dataRows) {
    const participant = rowToParticipant(row, headerMap);
    if (participant !== null) {
      participants.push(participant);
    }
  }

  return participants;
}
