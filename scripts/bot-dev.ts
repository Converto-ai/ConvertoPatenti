/**
 * Bot dev runner — long polling mode for local development.
 *
 * Usage:
 *   npm run bot:dev
 *
 * Requires:
 *   .env.local with TELEGRAM_BOT_TOKEN and DATABASE_URL set.
 *
 * In production the bot is driven by webhooks (api/telegram/webhook).
 * Locally, long polling is simpler than exposing a port via ngrok.
 */

import * as dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function main() {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.error("❌  TELEGRAM_BOT_TOKEN is not set in .env.local");
    process.exit(1);
  }
  if (!process.env.DATABASE_URL) {
    console.error("❌  DATABASE_URL is not set in .env.local");
    process.exit(1);
  }

  console.log("🤖  Starting ConvertoPatenti bot in long-polling mode…");
  console.log(`    Bot username: @${process.env.TELEGRAM_BOT_USERNAME ?? "ConvertoPatentiBot"}`);

  const { createBot } = await import("../src/lib/telegram/bot");
  const bot = createBot();

  // Graceful shutdown
  const stop = () => {
    console.log("\n🛑  Stopping bot…");
    bot.stop();
    process.exit(0);
  };
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);

  await bot.start({
    onStart(info) {
      console.log(`✅  Bot @${info.username} running (long polling)`);
      console.log("    Press Ctrl+C to stop.\n");
    },
  });
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
