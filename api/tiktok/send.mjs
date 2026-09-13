import { SESSION_COOKIE, decryptSession, json, parseCookies, tiktokRequest } from "../../lib/tiktok-session.mjs";

const MEDIA_PREFIX = "https://dftechomxybuapopiuqc.supabase.co/storage/v1/object/public/tiktok-media/";

export default async function handler(request, response) {
  if (request.method !== "POST") return json(response, 405, { error: "Method not allowed" });
  try {
    const session = decryptSession(parseCookies(request)[SESSION_COOKIE]);
    if (session.expires_at <= Date.now()) throw new Error("TikTok連携の有効期限が切れました。再連携してください。");
    const body = request.body || {};
    const images = Array.isArray(body.images) ? body.images.map(String) : [];
    const title = String(body.title || "").trim();
    const description = String(body.description || "").trim();
    if (!body.consent) throw new Error("送信前の同意が必要です");
    if (!title || title.length > 90) throw new Error("タイトルは1〜90文字で入力してください");
    if (!description || description.length > 4000) throw new Error("説明文は1〜4000文字で入力してください");
    if (images.length < 1 || images.length > 35) throw new Error("画像は1〜35枚必要です");
    if (!images.every((url) => url.startsWith(MEDIA_PREFIX))) throw new Error("所有確認済みのtiktok-media URLだけを使用できます");
    const data = await tiktokRequest("/v2/post/publish/content/init/", session.access_token, {
      method: "POST",
      body: JSON.stringify({ media_type: "PHOTO", post_mode: "MEDIA_UPLOAD", post_info: { title, description }, source_info: { source: "PULL_FROM_URL", photo_images: images, photo_cover_index: 0 }, is_aigc: Boolean(body.is_aigc) }),
    });
    if (!data.publish_id) throw new Error("TikTokから公開IDが返りませんでした");
    json(response, 200, { publish_id: data.publish_id });
  } catch (error) { json(response, 400, { error: error.message }); }
}
