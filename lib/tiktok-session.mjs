import crypto from "node:crypto";

export const SESSION_COOKIE = "kurashi_tiktok_session";
export const STATE_COOKIE = "kurashi_tiktok_state";

export function parseCookies(request) {
  return Object.fromEntries((request.headers.cookie || "").split(";").filter(Boolean).map((part) => {
    const index = part.indexOf("=");
    return [part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1))];
  }));
}

function key() {
  const secret = process.env.TIKTOK_SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("サーバーのセッション設定が未完了です");
  return crypto.createHash("sha256").update(secret).digest();
}

export function encryptSession(value) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString("base64url");
}

export function decryptSession(value) {
  if (!value) throw new Error("TikTokアカウントが未連携です");
  const packed = Buffer.from(value, "base64url");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key(), packed.subarray(0, 12));
  decipher.setAuthTag(packed.subarray(12, 28));
  return JSON.parse(Buffer.concat([decipher.update(packed.subarray(28)), decipher.final()]).toString("utf8"));
}

export function cookie(name, value, maxAge) {
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

export function json(response, status, body) {
  response.status(status).setHeader("Content-Type", "application/json; charset=utf-8").send(JSON.stringify(body));
}

export async function tiktokRequest(path, accessToken, options = {}) {
  const apiResponse = await fetch(`https://open.tiktokapis.com${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json; charset=UTF-8", ...(options.headers || {}) },
  });
  const payload = await apiResponse.json().catch(() => ({}));
  const apiError = payload.error || {};
  if (!apiResponse.ok || (apiError.code && apiError.code !== "ok")) throw new Error(apiError.message || `TikTok API error (${apiResponse.status})`);
  return payload.data || {};
}
