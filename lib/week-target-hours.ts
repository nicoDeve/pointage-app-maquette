import type { WeekData } from "@/contexts/timesheet-context"
import { countMonFriExcludingHolidays } from "@/lib/iso-week-workdays"
import { HOURS_PER_WORKDAY } from "@/lib/month-iso-weeks"

/** Année ISO de référence pour la maquette (données semaines 2026). */
export const DEMO_ISO_WEEK_YEAR = 2026

/**
 * Objectif d’heures affiché / saisie : dérivé des jours ouvrés lun–ven hors fériés si le calendrier est chargé,
 * sinon `week.targetHours` (données métier).
 */
export function resolveDisplayTargetHours(
  week: WeekData,
  holidayMapForYear: ReadonlyMap<string, string> | undefined | null,
): number {
  if (!holidayMapForYear || holidayMapForYear.size === 0) return week.targetHours
  const isoYear = week.isoWeekYear ?? DEMO_ISO_WEEK_YEAR
  const holidayKeys = new Set(holidayMapForYear.keys())
  const workdays = countMonFriExcludingHolidays(isoYear, week.weekNumber, holidayKeys)
  if (workdays <= 0) return week.targetHours
  return workdays * HOURS_PER_WORKDAY
}
