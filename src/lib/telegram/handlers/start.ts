import type { CommandContext } from "grammy";
import type { BotContext } from "../types";
import { db, pratiche } from "@/src/lib/db";
import { eq } from "drizzle-orm";

export async function handleStart(ctx: CommandContext<BotContext>) {
  const token = ctx.match?.trim();
  const chatId = String(ctx.chat.id);

  if (!token) {
    await ctx.reply(
      "👋 ConvertoPatenti Bot\n\nUsa il link fornito dalla tua autoscuola per iniziare."
    );
    return;
  }

  console.log(`[Bot] /start token=${token.slice(0, 8)}…`);

  const pratica = await db.query.pratiche.findFirst({
    where: eq(pratiche.telegramToken, token),
    with: { autoscuola: true },
  });

  if (!pratica) {
    console.log("[Bot] Token not found");
    await ctx.reply("❌ Link non valido o scaduto.\nContatta l'autoscuola per un nuovo link.");
    return;
  }

  if (pratica.stato === "completata" || pratica.stato === "archiviata") {
    await ctx.reply("✅ Hai già completato il questionario.\nL'autoscuola ti contatterà presto.");
    return;
  }

  // Init session
  ctx.session.praticaId = pratica.id;
  ctx.session.autoscuolaId = pratica.autoscuolaId;
  ctx.session.autoscuolaNome = pratica.autoscuola?.nome ?? "Autoscuola";
  ctx.session.step = "language";

  // Update pratica
  await db
    .update(pratiche)
    .set({ telegramChatId: chatId, stato: "intake_in_corso", updatedAt: new Date() })
    .where(eq(pratiche.id, pratica.id));

  console.log(`[Bot] Pratica ${pratica.id} → showing language keyboard`);

  // Show language keyboard (regular keyboard, not inline)
  await ctx.reply("🌍 *Seleziona la tua lingua / Select your language:*", {
    parse_mode: "Markdown",
    reply_markup: {
      keyboard: [
        [{ text: "🇮🇹 Italiano" }, { text: "🇬🇧 English" }, { text: "🇫🇷 Français" }],
        [{ text: "🇸🇦 العربية" }, { text: "🇪🇸 Español" }, { text: "🇵🇹 Português" }],
        [{ text: "🇷🇴 Română" }, { text: "🇺🇦 Українська" }, { text: "🇷🇺 Русский" }],
        [{ text: "🇨🇳 中文" }, { text: "🇵🇰 اردو" }, { text: "🇵🇭 Filipino" }],
      ],
      resize_keyboard: true,
      one_time_keyboard: true,
    },
  });
}
