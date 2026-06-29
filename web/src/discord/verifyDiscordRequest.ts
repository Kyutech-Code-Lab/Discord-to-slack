/**
 * Discord Interactions Endpoint の Ed25519 署名検証。
 *
 * 依存ライブラリを追加せず、Node 標準の WebCrypto
 * (`globalThis.crypto.subtle`) のみで実装している。
 */

/**
 * 16進文字列を `Uint8Array` に変換する。
 *
 * 奇数長 / 16進以外の文字が含まれる場合は不正としてエラーを投げる。
 * （呼び出し側で握って `false` に倒す前提。）
 */
function hexToBytes(hex: string): Uint8Array<ArrayBuffer> {
  if (hex.length % 2 !== 0) {
    throw new Error("invalid hex length");
  }

  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i += 1) {
    const byte = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    // parseInt は "zz" 等で NaN を返すため、不正文字を弾く。
    if (Number.isNaN(byte)) {
      throw new Error("invalid hex character");
    }
    bytes[i] = byte;
  }
  return bytes;
}

export async function verifyDiscordRequest(params: {
  rawBody: string;
  signature: string | null;
  timestamp: string | null;
  publicKey: string;
}): Promise<boolean> {
  const { rawBody, signature, timestamp, publicKey } = params;

  // 署名・タイムスタンプが欠落していれば即座に検証失敗とする。
  if (!signature || !timestamp) {
    return false;
  }

  try {
    const publicKeyBytes = hexToBytes(publicKey);
    const signatureBytes = hexToBytes(signature);

    // 検証対象メッセージは timestamp + rawBody を UTF-8 エンコードしたもの。
    const message = new TextEncoder().encode(timestamp + rawBody);

    const key = await crypto.subtle.importKey(
      "raw",
      publicKeyBytes,
      { name: "Ed25519" },
      false,
      ["verify"],
    );

    return await crypto.subtle.verify(
      { name: "Ed25519" },
      key,
      signatureBytes,
      message,
    );
  } catch {
    // 不正な16進文字列・鍵長不一致・WebCrypto 例外などはすべて
    // 「検証失敗」として false に倒す。秘密情報やボディはログに残さない。
    return false;
  }
}
