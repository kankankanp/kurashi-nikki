import { SESSION_COOKIE, STATE_COOKIE, cookie, encryptSession, parseCookies } from "../../lib/tiktok-session.mjs";

export default async function handler(request, response) {
  try {
    const cookies = parseCookies(request);
    const { code, state, error, error_description: description } = request.query;
    if (error) throw new Error(description || error);
    if (!code || !state || !cookies[STATE_COOKIE] || state !== cookies[STATE_COOKIE]) throw new Error("認証状態を確認できませんでした。最初からやり直してください。");
    const tokenResponse = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ client_key: process.env.TIKTOK_CLIENT_KEY || "", client_secret: process.env.TIKTOK_CLIENT_SECRET || "", code, grant_type: "authorization_code", redirect_uri: process.env.TIKTOK_REDIRECT_URI || "" }),
    });
    const token = await tokenResponse.json();
    if (!tokenResponse.ok || !token.access_token) throw new Error(token.error_description || "TikTokトークンを取得できませんでした");
    const session = encryptSession({ access_token: token.access_token, expires_at: Date.now() + Number(token.expires_in || 86400) * 1000, scope: token.scope || "" });
    response.setHeader("Set-Cookie", [cookie(SESSION_COOKIE, session, Math.min(Number(token.expires_in || 86400), 86400)), cookie(STATE_COOKIE, "", 0)]);
    response.redirect(302, "/?connected=1");
  } catch (error) {
    response.redirect(302, `/?oauth_error=${encodeURIComponent(error.message)}`);
  }
}
