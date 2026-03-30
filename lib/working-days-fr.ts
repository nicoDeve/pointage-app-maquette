import { eachDayOfInterval } from "date-fns"

import { toLocalDateKey } from "@/lib/date-keys"

/**
 * Nombre de jours ouvrés entre deux dates incluses : lundi–vendredi,
 * hors jours présents dans `holidayKeys` (YYYY-MM-DD, fériés métropole).
 */
export function countFrWorkingDaysInRange(
  start: Date,
  end: Date,
  holidayKeys: ReadonlySet<string>,
): number {
  const a = start <= end ? start : end
  const b = start <= end ? end : start
  let n = 0
  for (const d of eachDayOfInterval({ start: a, end: b })) {
    const dow = d.getDay()
    if (dow === 0 || dow === 6) continue
    if (holidayKeys.has(toLocalDateKey(d))) continue
    n++
  }
  return n
}
