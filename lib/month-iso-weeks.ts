/**
 * Semaines ISO et jours ouvrés (lun–ven) pour un mois calendaire.
 * À utiliser partout où l’on découpe un mois en semaines qui se chevauchent (Support, exports, panneaux).
 */

import {
  eachDayOfInterval,
  endOfMonth,
  format,
  getISOWeek,
  getISOWeekYear,
  startOfMonth,
} from "date-fns"
import { fr } from "date-fns/locale"

/** Index 0 = lundi … 4 = vendredi (aligné getDay(): lun = 1 → idx 0) */
export type IsoWeekdayIndex = 0 | 1 | 2 | 3 | 4

export interface CalendarWorkday {
  date: Date
  weekdayIndex: IsoWeekdayIndex
}

/** Semaine ISO qui intersecte le mois : uniquement les jours ouvrés réellement dans le mois */
export interface MonthWeekSlice {
  isoWeek: number
  isoWeekYear: number
  workdaysInMonth: CalendarWorkday[]
}

export const HOURS_PER_WORKDAY = 7

export const ISO_WEEKDAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven"] as const

/**
 * Bâtonnets Support / cohérence app : complet vert, partiel jaune, absence rouge, vide neutre.
 */
export const TIMESHEET_DAY_STICK_CLASS = {
  full:
    "h-5 w-1.5 shrink-0 rounded-sm border sm:w-2 border-green-500/50 bg-green-50 dark:border-green-600/50 dark:bg-green-950/35",
  partial:
    "h-5 w-1.5 shrink-0 rounded-sm border sm:w-2 border-yellow-500/60 bg-yellow-50 dark:border-yellow-600/45 dark:bg-yellow-950/30",
  empty:
    "h-5 w-1.5 shrink-0 rounded-sm border sm:w-2 border-border/60 bg-muted/40 opacity-90 dark:border-border dark:bg-muted/50",
  absent:
    "h-5 w-1.5 shrink-0 rounded-sm border sm:w-2 border-red-400/85 bg-red-50 dark:border-red-800/50 dark:bg-red-950/30 dark:ring-1 dark:ring-red-950/25",
} as const

export type WorkdayStickVisualState = keyof typeof TIMESHEET_DAY_STICK_CLASS

/** Texte des heures / barre (partiel = jaune, pas ambre/orange) */
export function timesheetDayHoursTextClass(hours: number): string {
  if (hours >= HOURS_PER_WORKDAY) return "text-green-600 dark:text-green-400"
  if (hours > 0) return "text-yellow-700 dark:text-yellow-400"
  return "text-muted-foreground/40"
}

export function timesheetDayProgressBarClass(hours: number): string {
  if (hours >= HOURS_PER_WORKDAY) return "bg-green-500"
  if (hours > 0) return "bg-yellow-500"
  return "bg-muted-foreground/20"
}

export function parseMonthPeriodId(id: string): { year: number; monthIndex0: number } | null {
  const m = /^(\d{4})-(\d{2})$/.exec(id.trim())
  if (!m) return null
  const year = Number(m[1])
  const month1 = Number(m[2])
  if (month1 < 1 || month1 > 12) return null
  return { year, monthIndex0: month1 - 1 }
}

/**
 * Toutes les semaines ISO qui ont au moins un jour ouvré dans le mois,
 * avec la liste **réelle** des dates (semaine courte en bord de mois = moins de jours).
 */
export function buildMonthWeekSlicesForCalendarMonth(
  year: number,
  monthIndex0: number
): MonthWeekSlice[] {
  const monthStart = startOfMonth(new Date(year, monthIndex0, 1))
  const monthEnd = endOfMonth(monthStart)
  const weekDays = new Map<string, CalendarWorkday[]>()

  for (const d of eachDayOfInterval({ start: monthStart, end: monthEnd })) {
    const dow = d.getDay()
    if (dow === 0 || dow === 6) continue
    const weekdayIndex = (dow - 1) as IsoWeekdayIndex
    const wk = getISOWeek(d)
    const wy = getISOWeekYear(d)
    const key = `${wy}|${wk}`
    if (!weekDays.has(key)) weekDays.set(key, [])
    weekDays.get(key)!.push({ date: new Date(d.getTime()), weekdayIndex })
  }

  const orderedKeys = [...weekDays.keys()].sort((a, b) => {
    const [ya, wa] = a.split("|").map(Number)
    const [yb, wb] = b.split("|").map(Number)
    if (ya !== yb) return ya - yb
    return wa - wb
  })

  return orderedKeys.map(key => {
    const [isoWeekYear, isoWeek] = key.split("|").map(Number)
    const workdaysInMonth = weekDays.get(key)!
    return { isoWeek, isoWeekYear, workdaysInMonth }
  })
}

export function buildMonthWeekSlicesFromPeriodId(monthId: string): MonthWeekSlice[] {
  const p = parseMonthPeriodId(monthId)
  if (!p) return []
  return buildMonthWeekSlicesForCalendarMonth(p.year, p.monthIndex0)
}

export function countWorkdaysInSlice(slice: MonthWeekSlice): number {
  return slice.workdaysInMonth.length
}

export function weekSliceTargetHours(
  slice: MonthWeekSlice,
  hoursPerDay = HOURS_PER_WORKDAY
): number {
  return countWorkdaysInSlice(slice) * hoursPerDay
}

export function monthTotalTargetHoursForSlices(
  slices: MonthWeekSlice[],
  hoursPerDay = HOURS_PER_WORKDAY
): number {
  return slices.reduce((s, w) => s + weekSliceTargetHours(w, hoursPerDay), 0)
}

/** Masque Lun–Ven (utile si un écran attend toujours 5 positions) */
export function sliceToWeekdayMask(slice: MonthWeekSlice): [boolean, boolean, boolean, boolean, boolean] {
  const m: [boolean, boolean, boolean, boolean, boolean] = [false, false, false, false, false]
  for (const wd of slice.workdaysInMonth) {
    m[wd.weekdayIndex] = true
  }
  return m
}

export type WeekEntryStatus = "complet" | "incomplet" | "absent"

/**
 * Répartition des heures de la semaine sur **les seuls** jours ouvrés du mois pour cette ISO week.
 */
export function workdayStickStatesForWeekEntry(
  hours: number,
  status: WeekEntryStatus,
  slice: MonthWeekSlice,
  hoursPerDay = HOURS_PER_WORKDAY
): WorkdayStickVisualState[] {
  const n = countWorkdaysInSlice(slice)
  if (n === 0) return []

  if (status === "absent") {
    return Array.from({ length: n }, () => "absent" as const)
  }

  let rem = hours
  const out: WorkdayStickVisualState[] = []
  for (let i = 0; i < n; i++) {
    if (rem >= hoursPerDay) {
      rem -= hoursPerDay
      out.push("full")
    } else if (rem > 0) {
      rem = 0
      out.push("partial")
    } else {
      out.push("empty")
    }
  }
  return out
}

export interface SimulatedWorkdayRow {
  date: Date
  label: string
  hours: number
  absent: boolean
}

/** Détail panneau : une ligne par jour ouvré **dans le mois** pour la semaine ISO (même logique que les bâtonnets). */
export function simulateWorkdaysInSlice(
  slice: MonthWeekSlice,
  weekHours: number,
  status: WeekEntryStatus,
  hoursPerDay = HOURS_PER_WORKDAY
): SimulatedWorkdayRow[] {
  if (status === "absent") {
    return slice.workdaysInMonth.map(wd => ({
      date: wd.date,
      label: format(wd.date, "EEE d", { locale: fr }),
      hours: hoursPerDay,
      absent: true,
    }))
  }
  let rem = weekHours
  return slice.workdaysInMonth.map(wd => {
    if (rem >= hoursPerDay) {
      rem -= hoursPerDay
      return {
        date: wd.date,
        label: format(wd.date, "EEE d", { locale: fr }),
        hours: hoursPerDay,
        absent: false,
      }
    }
    const h = rem
    rem = 0
    return {
      date: wd.date,
      label: format(wd.date, "EEE d", { locale: fr }),
      hours: h,
      absent: false,
    }
  })
}

/** En-têtes CSV : une colonne par semaine ISO du mois */
export function buildMonthExportWeekColumnTitles(slices: MonthWeekSlice[]): string[] {
  return slices.map(s => `S${s.isoWeek}_${countWorkdaysInSlice(s)}j`)
}
