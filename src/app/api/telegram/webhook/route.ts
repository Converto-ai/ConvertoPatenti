import { NextRequest, NextResponse } from "next/server";
import { createBot } from "@/src/lib/telegram/bot";

// Grammy bot instance (singleton)
let bot: ReturnType<typeof createBot> | null = null;

async function getBot() {
  if (!bot) {
    bot = createBot();
    await bot.init();
  }
  return bot;
}

export async function POST(req: NextRequest) {
  // Verify Telegram webhook secret
  const secret = req.headers.get("x-telegram-bot-api-secret-token");
  if (secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const b = await getBot();
    await b.handleUpdate(body);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[Webhook] Error processing update:", err);
    // Always return 200 to Telegram (to avoid retries)
    return NextResponse.json({ ok: true });
  }
}

// Health check
export async function GET() {
  return NextResponse.json({ status: "bot webhook active" });
}
