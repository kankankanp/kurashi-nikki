import { SESSION_COOKIE, decryptSession, json, parseCookies, tiktokRequest } from "../../lib/tiktok-session.mjs";

export default async function handler(request, response) {
  try {
    const session = decryptSession(parseCookies(request)[SESSION_COOKIE]);
    if (session.expires_at <= Date.now()) throw new Error("TikTok連携の有効期限が切れました");
    const data = await tiktokRequest("/v2/user/info/?fields=open_id,display_name,avatar_url", session.access_token, { method: "GET" });
    json(response, 200, data.user || {});
  } catch (error) { json(response, 401, { error: error.message }); }
}
