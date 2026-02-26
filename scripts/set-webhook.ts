import * as dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;
const APP_URL = process.env.APP_URL ?? process.env.VERCEL_URL;

async function main() {
  if (!BOT_TOKEN) {
    console.error("❌ TELEGRAM_BOT_TOKEN non configurato");
    process.exit(1);
  }
  if (!APP_URL) {
    console.error("❌ APP_URL o VERCEL_URL non configurato");
    console.error("   Usa: APP_URL=https://tuodominio.vercel.app npm run bot:set-webhook");
    process.exit(1);
  }

  const webhookUrl = APP_URL.startsWith("http")
    ? `${APP_URL}/api/telegram/webhook`
    : `https://${APP_URL}/api/telegram/webhook`;

  console.log(`Setting webhook to: ${webhookUrl}`);

  const res = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: webhookUrl,
        secret_token: WEBHOOK_SECRET,
        allowed_updates: ["message", "callback_query"],
      }),
    }
  );

  const data = await res.json();

  if (data.ok) {
    console.log("✅ Webhook registrato con successo");
  } else {
    console.error("❌ Errore:", data.description);
    process.exit(1);
  }
}

main();
