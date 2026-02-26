/**
 * Telegram deep link tokens.
 *
 * Telegram's ?start= parameter only supports A-Z, a-z, 0-9, _ and - (max 64 chars).
 * We use a compact random UUID (32 hex chars, no dashes) stored in the DB.
 * No JWT signing needed — the token is unguessable and verified by DB lookup.
 */

export function createTelegramToken(): string {
  return crypto.randomUUID().replace(/-/g, "");
}
