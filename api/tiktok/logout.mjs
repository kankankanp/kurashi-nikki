import { SESSION_COOKIE, cookie, json } from "../../lib/tiktok-session.mjs";

export default function handler(request, response) {
  response.setHeader("Set-Cookie", cookie(SESSION_COOKIE, "", 0));
  json(response, 200, { ok: true });
}
