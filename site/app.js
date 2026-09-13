const $ = (id) => document.getElementById(id);
const state = { connected: false, images: [] };

function setResult(message, type) { const node = $("result"); node.textContent = message; node.className = `result ${type}`; node.hidden = false; }
function parseImageUrls() {
  const urls = $("image-urls").value.split(/\r?\n/).map((value) => value.trim()).filter(Boolean);
  state.images = urls; $("image-count").textContent = `${urls.length}枚`; $("preview-empty").hidden = urls.length > 0;
  $("preview").replaceChildren(...urls.map((url, index) => {
    const figure = document.createElement("figure"); const image = document.createElement("img"); image.src = url; image.alt = `送信予定画像 ${index + 1}`; image.loading = "lazy";
    const caption = document.createElement("figcaption"); caption.textContent = `${index + 1} / ${urls.length}`; figure.append(image, caption); return figure;
  }));
}
async function loadAccount() {
  try {
    const response = await fetch("/api/tiktok/account", { credentials: "same-origin" }); if (!response.ok) return;
    const account = await response.json(); state.connected = true; $("connection-status").textContent = "連携済み"; $("connection-status").className = "status connected";
    $("account-name").textContent = account.display_name || "TikTokアカウント"; $("account-avatar").src = account.avatar_url || ""; $("account-card").hidden = false;
    $("account-message").hidden = true; $("connect-button").hidden = true; $("logout-button").hidden = false;
  } catch (_) {}
}
$("title").addEventListener("input", (event) => $("title-count").textContent = `${event.target.value.length} / 90`);
$("description").addEventListener("input", (event) => $("description-count").textContent = `${event.target.value.length} / 4000`);
$("image-urls").addEventListener("input", parseImageUrls);
$("logout-button").addEventListener("click", async () => { await fetch("/api/tiktok/logout", { method: "POST", credentials: "same-origin" }); window.location.reload(); });
$("draft-form").addEventListener("submit", async (event) => {
  event.preventDefault(); $("result").hidden = true; parseImageUrls();
  if (!state.connected) return setResult("先にTikTokアカウントを連携してください。", "error");
  if (!event.currentTarget.reportValidity()) return;
  if (state.images.length < 1 || state.images.length > 35) return setResult("画像URLは1〜35枚にしてください。", "error");
  if (!state.images.every((url) => url.startsWith("https://"))) return setResult("画像URLはすべてHTTPSで入力してください。", "error");
  const button = $("send-button"); button.disabled = true; button.textContent = "送信中…";
  try {
    const response = await fetch("/api/tiktok/send", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: $("title").value.trim(), description: $("description").value.trim(), images: state.images, is_aigc: $("aigc").checked, commercial_content: $("commercial").checked, consent: $("consent").checked }) });
    const data = await response.json(); if (!response.ok) throw new Error(data.error || "TikTokへの送信に失敗しました。");
    setResult(`TikTokの受信箱へ下書きを送りました。公開ID: ${data.publish_id}。TikTokアプリで最終確認してください。`, "success");
  } catch (error) { setResult(error.message, "error"); }
  finally { button.disabled = false; button.textContent = "TikTokの下書きへ送る"; }
});
const params = new URLSearchParams(location.search); if (params.get("oauth_error")) setResult(params.get("oauth_error"), "error");
loadAccount();
