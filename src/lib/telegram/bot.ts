import { Bot, session } from "grammy";
import type { BotContext, SessionData } from "./types";
import { handleStart } from "./handlers/start";
import { handleMessage } from "./handlers/message";
import { handleCallback } from "./handlers/callback";
import { db } from "@/src/lib/db";
import { telegramSessioni } from "@/src/lib/db/schema";
import { eq } from "drizzle-orm";

if (!process.env.TELEGRAM_BOT_TOKEN) {
  throw new Error("TELEGRAM_BOT_TOKEN is required");
}

/** Drizzle-backed session storage for Grammy */
function createDbSessionStorage() {
  return {
    read: async (key: string): Promise<SessionData | undefined> => {
      const [row] = await db
        .select({ datiRaccolti: telegramSessioni.datiRaccolti })
        .from(telegramSessioni)
        .where(eq(telegramSessioni.chatId, key))
        .limit(1);
      if (!row?.datiRaccolti) return undefined;
      return row.datiRaccolti as unknown as SessionData;
    },
    write: async (key: string, value: SessionData): Promise<void> => {
      await db
        .insert(telegramSessioni)
        .values({
          chatId: key,
          datiRaccolti: value as unknown as Record<string, unknown>,
          lingua: value.locale ?? "it",
          praticaId: value.praticaId ?? null,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: telegramSessioni.chatId,
          set: {
            datiRaccolti: value as unknown as Record<string, unknown>,
            lingua: value.locale ?? "it",
            praticaId: value.praticaId ?? null,
            updatedAt: new Date(),
          },
        });
    },
    delete: async (key: string): Promise<void> => {
      await db
        .delete(telegramSessioni)
        .where(eq(telegramSessioni.chatId, key));
    },
  };
}

export function createBot() {
  const bot = new Bot<BotContext>(process.env.TELEGRAM_BOT_TOKEN!);

  bot.use(
    session({
      initial: (): SessionData => ({
        locale: "it" as const,
        step: "idle",
      }),
      storage: createDbSessionStorage(),
      getSessionKey: (ctx) => ctx.chat?.id?.toString(),
    })
  );

  bot.command("start", handleStart);
  bot.on("callback_query:data", handleCallback);
  bot.on(["message:text", "message:photo"], handleMessage);

  bot.catch((err) => {
    console.error("[Bot] Error:", err.error);
    if (err.error instanceof Error) console.error("[Bot] Stack:", err.error.stack);
  });

  return bot;
}
