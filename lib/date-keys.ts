/** Clé locale YYYY-MM-DD (calendrier France, sans UTC). */
export function toLocalDateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

/** Samedi / dimanche (France). */
export function isWeekendFr(d: Date): boolean {
  const dow = d.getDay()
  return dow === 0 || dow === 6
}
