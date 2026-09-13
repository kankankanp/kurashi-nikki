import crypto from "node:crypto";
import { STATE_COOKIE, cookie } from "../../lib/tiktok-session.mjs";

export default function handler(request, response) {
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const redirectUri = process.env.TIKTOK_REDIRECT_URI;
  if (!clientKey || !redirectUri) return response.status(503).send("TikTok連携設定が未完了です");
  const state = crypto.randomBytes(24).toString("base64url");
  const query = new URLSearchParams({ client_key: clientKey, response_type: "code", scope: "user.info.basic,video.upload", redirect_uri: redirectUri, state });
  response.setHeader("Set-Cookie", cookie(STATE_COOKIE, state, 600));
  response.redirect(302, `https://www.tiktok.com/v2/auth/authorize/?${query}`);
}
