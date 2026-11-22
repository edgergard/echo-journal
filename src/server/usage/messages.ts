/** The limit state copy (design.md), shared by replies and week summaries. */
export function dailyLimitMessage(limit: number): string {
  return `You've used today's ${limit} ${limit === 1 ? "reply" : "replies"}. Echo will be back tomorrow.`;
}
