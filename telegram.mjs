import { getStore } from "@netlify/blobs";

const { BOT_TOKEN, OWNER_ID, WEBHOOK_SECRET } = process.env;

const reply = (chat, text) =>
  fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chat, text }),
  });

export default async (req) => {
  if (
    req.method !== "POST" ||
    req.headers.get("x-telegram-bot-api-secret-token") !== WEBHOOK_SECRET
  ) {
    return new Response("forbidden", { status: 403 });
  }

  const msg = (await req.json()).message;
  if (!msg?.text || String(msg.from?.id) !== OWNER_ID) return new Response("ok");

  const store = getStore("weight");
  const history = (await store.get("history", { type: "json" })) || [];
  const text = msg.text.trim();

  if (text === "/undo") {
    const removed = history.pop();
    await store.setJSON("history", history);
    await reply(msg.chat.id, removed ? `↩️ Удалено: ${removed.w} кг` : "Записей нет");
    return new Response("ok");
  }

  const m = text.match(/^(\d{2,3}(?:[.,]\d{1,2})?)\s*(?:кг|kg)?$/i);
  const w = m && parseFloat(m[1].replace(",", "."));
  if (!w || w < 20 || w > 300) {
    await reply(msg.chat.id, "Отправь вес числом, например 72.4");
    return new Response("ok");
  }

  const prev = history.at(-1)?.w;
  history.push({ w, t: Date.now() });
  await store.setJSON("history", history.slice(-365));

  const diff = prev ? ` (${w >= prev ? "+" : "−"}${Math.abs(w - prev).toFixed(1)})` : "";
  await reply(msg.chat.id, `✅ ${w} кг записано${diff}`);
  return new Response("ok");
};

export const config = { path: "/api/telegram" };
