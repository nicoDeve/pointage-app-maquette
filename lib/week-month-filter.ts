import type { WeekData } from "@/contexts/timesheet-context"
import { getIsoWeekWorkdaySlots } from "@/lib/iso-week-workdays"

/** Clés `YYYY-MM` présentes dans les jours ouvrés (lun–ven) des semaines. */
export function collectCalendarMonthKeysFromWeeks(
  weeks: WeekData[],
  defaultIsoYear: number,
): string[] {
  const set = new Set<string>()
  for (const w of weeks) {
    const isoY = w.isoWeekYear ?? defaultIsoYear
    const slots = getIsoWeekWorkdaySlots(isoY, w.weekNumber)
    for (const s of slots) {
      const d = s.date
      set.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`)
    }
  }
  return [...set].sort()
}

/** La semaine a au moins un jour ouvré dans ce mois civil. */
export function weekHasWorkdayInCalendarMonth(
  week: WeekData,
  year: number,
  monthIndex0to11: number,
  defaultIsoYear: number,
): boolean {
  const isoY = week.isoWeekYear ?? defaultIsoYear
  const slots = getIsoWeekWorkdaySlots(isoY, week.weekNumber)
  return slots.some((s) => s.date.getFullYear() === year && s.date.getMonth() === monthIndex0to11)
}
