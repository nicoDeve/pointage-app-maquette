import { addDays, format, setISOWeek, startOfISOWeek } from "date-fns"
import { fr } from "date-fns/locale"

import type { DayOfWeek } from "@/contexts/timesheet-context"
import { toLocalDateKey } from "@/lib/date-keys"

const ISO_LUN_VEN: DayOfWeek[] = ["lun", "mar", "mer", "jeu", "ven"]

/** Lundi de la semaine ISO (année ISO + numéro de semaine). */
export function mondayOfIsoWeek(isoWeekYear: number, isoWeek: number): Date {
  const ref = new Date(isoWeekYear, 0, 4)
  return startOfISOWeek(setISOWeek(ref, isoWeek))
}

/** Clés locales YYYY-MM-DD du lundi au vendredi de la semaine ISO. */
export function monFriDateKeysInIsoWeek(isoWeekYear: number, isoWeek: number): string[] {
  const mon = mondayOfIsoWeek(isoWeekYear, isoWeek)
  return [0, 1, 2, 3, 4].map((i) => toLocalDateKey(addDays(mon, i)))
}

/**
 * Nombre de jours ouvrés (lun–ven) dans la semaine ISO, hors jours présents dans `holidayKeys`.
 * `holidayKeys` : ensemble de dates `YYYY-MM-DD` (métropole).
 */
export function countMonFriExcludingHolidays(
  isoWeekYear: number,
  isoWeek: number,
  holidayKeys: ReadonlySet<string>,
): number {
  return monFriDateKeysInIsoWeek(isoWeekYear, isoWeek).filter((k) => !holidayKeys.has(k)).length
}

/** Les 5 jours lundi–vendredi de la semaine ISO, avec date civile (repère visuel + fériés). */
export function getIsoWeekWorkdaySlots(
  isoWeekYear: number,
  isoWeek: number,
): { day: DayOfWeek; date: Date; dateKey: string }[] {
  const mon = mondayOfIsoWeek(isoWeekYear, isoWeek)
  return [0, 1, 2, 3, 4].map((i) => {
    const date = addDays(mon, i)
    return {
      day: ISO_LUN_VEN[i]!,
      date,
      dateKey: toLocalDateKey(date),
    }
  })
}

/** Libellés cohérents avec le lundi–vendredi ISO (les chaînes mock seules se trompaient souvent d’un jour). */
export function formatIsoWeekRangeDisplayFr(isoWeekYear: number, isoWeek: number) {
  const slots = getIsoWeekWorkdaySlots(isoWeekYear, isoWeek)
  const mon = slots[0]!.date
  const fri = slots[4]!.date
  return {
    startDate: format(mon, "d MMM", { locale: fr }),
    endDate: format(fri, "d MMM yyyy", { locale: fr }),
  }
}
