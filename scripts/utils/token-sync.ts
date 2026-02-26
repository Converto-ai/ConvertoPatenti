// Simple token for Telegram deep links (?start= accepts only A-Za-z0-9_- max 64 chars)
export function createTelegramTokenSync(): string {
  return crypto.randomUUID().replace(/-/g, "");
}
