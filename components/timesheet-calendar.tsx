"use client"

import { useState } from "react"
import { notifyError } from "@/lib/notify"
import { WeekData } from "@/contexts/timesheet-context"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { CalendarDayHoverCard, type CalendarDayEventItem } from "@/components/calendar-day-hover-card"
import { isWeekendFr, toLocalDateKey } from "@/lib/date-keys"
import { TIMESHEET_CALENDAR_SELECT_YEARS } from "@/lib/timesheet-calendar-years"

export interface TimesheetHolidayLookup {
  getHolidayName: (dateKey: string, year: number) => string | undefined
  loading: boolean
  error: string | null
}

interface TimesheetCalendarProps {
  weeks: WeekData[]
  onWeekSelect: (weekData: WeekData) => void
  onAddClick?: (weekNumber?: number, date?: Date) => void
  onDateClick?: (date: Date, weekNumber: number) => void
  holidayLookup: TimesheetHolidayLookup
}

interface CalendarEvent extends CalendarDayEventItem {
  date: Date
}

const sampleEvents: CalendarEvent[] = [
  { date: new Date(2026, 9, 5), type: "work", label: "Projet Alpha", hours: 7, project: "Alpha" },
  { date: new Date(2026, 9, 5), type: "meeting", label: "Reunion equipe", hours: 1 },
  { date: new Date(2026, 9, 6), type: "work", label: "Projet Beta", hours: 8, project: "Beta" },
  { date: new Date(2026, 9, 7), type: "work", label: "Projet Alpha", hours: 7, project: "Alpha" },
  { date: new Date(2026, 9, 8), type: "meeting", label: "Review sprint" },
  { date: new Date(2026, 9, 9), type: "work", label: "Support", hours: 4, project: "Support" },
  { date: new Date(2026, 9, 12), type: "absence", label: "Conges payes", hours: 7 },
  { date: new Date(2026, 9, 13), type: "absence", label: "Conges payes", hours: 7 },
  { date: new Date(2026, 9, 14), type: "work", label: "Projet Alpha", hours: 8, project: "Alpha" },
  { date: new Date(2026, 9, 15), type: "deadline", label: "Livraison Sprint 41" },
  { date: new Date(2026, 9, 18), type: "work", label: "Projet Beta", hours: 7, project: "Beta" },
  { date: new Date(2026, 9, 19), type: "work", label: "Formation", hours: 4, project: "Formation" },
  { date: new Date(2026, 9, 19), type: "meeting", label: "1:1 Manager" },
  { date: new Date(2026, 9, 22), type: "work", label: "Projet Alpha", hours: 8, project: "Alpha" },
]

export function TimesheetCalendar({
  weeks,
  onWeekSelect,
  onDateClick,
  holidayLookup,
}: TimesheetCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 9, 1))
  const [selectedYear, setSelectedYear] = useState(2026)

  const { getHolidayName, loading: holidaysLoading, error: holidaysError } = holidayLookup

  const daysOfWeek = ["Sem.", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]
  const months = [
    "Janvier", "Fevrier", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Aout", "Septembre", "Octobre", "Novembre", "Decembre",
  ]

  const getWeekNumber = (date: Date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    const dayNum = d.getUTCDay() || 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  }

  const getWeeksInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)

    const firstMonday = new Date(firstDay)
    const dayOfWeek = firstDay.getDay()
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    firstMonday.setDate(firstDay.getDate() + diff)

    const weeksData: { weekNumber: number; days: { date: Date; isCurrentMonth: boolean }[] }[] = []

    let currentWeekStart = new Date(firstMonday)

    while (currentWeekStart <= lastDay || weeksData.length < 5) {
      const weekDays: { date: Date; isCurrentMonth: boolean }[] = []
      const weekNum = getWeekNumber(currentWeekStart)

      for (let i = 0; i < 7; i++) {
        const day = new Date(currentWeekStart)
        day.setDate(currentWeekStart.getDate() + i)
        weekDays.push({
          date: day,
          isCurrentMonth: day.getMonth() === month,
        })
      }

      weeksData.push({
        weekNumber: weekNum,
        days: weekDays,
      })

      currentWeekStart.setDate(currentWeekStart.getDate() + 7)

      if (weeksData.length >= 6) break
    }

    return weeksData
  }

  const sampleForDate = (date: Date) =>
    sampleEvents.filter(
      (e) =>
        e.date.getDate() === date.getDate() &&
        e.date.getMonth() === date.getMonth() &&
        e.date.getFullYear() === date.getFullYear(),
    )

  /** Jour non ouvré : week-end ou jour férié métropole (API gouv). */
  const nonWorkInfo = (date: Date): { label: string } | null => {
    const key = toLocalDateKey(date)
    const y = date.getFullYear()
    const ferie = getHolidayName(key, y)
    if (ferie) return { label: ferie }
    if (isWeekendFr(date)) return { label: "Week-end" }
    return null
  }

  const getEventsForDate = (date: Date): CalendarEvent[] => {
    const nw = nonWorkInfo(date)
    const work = sampleForDate(date)
    if (!nw) return work
    return [{ date, type: "holiday", label: nw.label }, ...work]
  }

  const getTotalHoursForDate = (events: CalendarEvent[]) => {
    return events.reduce((sum, e) => sum + (e.hours || 0), 0)
  }

  const navigateMonth = (direction: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1))
  }

  const handleYearChange = (year: string) => {
    const newYear = parseInt(year, 10)
    setSelectedYear(newYear)
    setCurrentDate(new Date(newYear, currentDate.getMonth(), 1))
  }

  const weeksData = getWeeksInMonth(currentDate)
  const today = new Date()

  const eventColors: Record<string, string> = {
    work: "bg-blue-500",
    meeting: "bg-purple-500",
    absence: "bg-red-500",
    deadline: "bg-rose-500",
    holiday: "bg-slate-500 dark:bg-slate-400",
  }

  const getWeekData = (weekNumber: number) => {
    return weeks.find((w) => w.weekNumber === weekNumber)
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })
  }

  const tryOpenDay = (date: Date, weekNumber: number) => {
    const nw = nonWorkInfo(date)
    if (nw) {
      notifyError("Saisie impossible", `${nw.label} — la saisie de temps n’est pas disponible ce jour.`)
      return
    }
    onDateClick?.(date, weekNumber)
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card">
      <div className="flex flex-col gap-1 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigateMonth(-1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigateMonth(1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <h2 className="text-sm font-medium text-foreground ml-2">
            {months[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          {holidaysLoading && (
            <span className="text-[10px] text-muted-foreground">Chargement jours fériés…</span>
          )}
          {holidaysError && (
            <span className="text-[10px] text-destructive" title={holidaysError}>
              Fériés indisponibles
            </span>
          )}
        </div>

        <Select value={selectedYear.toString()} onValueChange={handleYearChange}>
          <SelectTrigger className="w-24 h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIMESHEET_CALENDAR_SELECT_YEARS.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2 border-b border-border bg-muted/30 px-4 py-2 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-slate-500 dark:bg-slate-400" />
          <span className="text-muted-foreground">Férié / week-end</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
          <span className="text-muted-foreground">Travail</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-purple-500" />
          <span className="text-muted-foreground">Reunion</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
          <span className="text-muted-foreground">Absence</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-rose-500" />
          <span className="text-muted-foreground">Deadline</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-muted/30">
              {daysOfWeek.map((day, i) => (
                <th
                  key={day}
                  className={`text-xs font-medium text-muted-foreground py-3 px-2 text-center border-b border-border ${
                    i === 0 ? "w-20 bg-muted/50" : ""
                  }`}
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeksData.map((week, weekIndex) => {
              const weekData = getWeekData(week.weekNumber)
              const isCurrentWeek = weekData?.isCurrent

              return (
                <tr
                  key={weekIndex}
                  className={`border-b border-border last:border-b-0 ${
                    isCurrentWeek ? "bg-blue-50/50 dark:bg-blue-950/20" : ""
                  }`}
                >
                  <td
                    className={`py-2 px-2 bg-muted/30 text-center border-r border-border cursor-pointer hover:bg-muted/50 transition-colors ${
                      isCurrentWeek ? "border-l-4 border-l-blue-500" : ""
                    }`}
                    onClick={() => weekData && onWeekSelect(weekData)}
                  >
                    <div className="text-xs text-muted-foreground">
                      <div className="font-medium">S{week.weekNumber}</div>
                      <div className={weekData ? "" : "text-muted-foreground/50"}>{weekData?.totalHours || 0}h</div>
                    </div>
                  </td>
                  {week.days.map((day, dayIndex) => {
                    const isToday = day.date.toDateString() === today.toDateString()
                    const dayNum = day.date.getDate()
                    const events = getEventsForDate(day.date)
                    const totalHours = getTotalHoursForDate(events)
                    const hasPopoverContent = events.length > 0
                    const blocked = nonWorkInfo(day.date) !== null

                    const cellContent = (
                      <div className="flex h-full flex-col">
                        <div
                          className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                            !day.isCurrentMonth
                              ? "text-muted-foreground/40"
                              : blocked
                                ? "bg-muted text-muted-foreground line-through decoration-muted-foreground/50"
                                : isToday
                                  ? "bg-primary font-medium text-primary-foreground"
                                  : "text-foreground"
                          }`}
                        >
                          {String(dayNum).padStart(2, "0")}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {events.map((event, idx) => (
                            <div key={idx} className={`h-2 w-2 rounded-full ${eventColors[event.type]}`} />
                          ))}
                        </div>
                        {!blocked && totalHours > 0 && (
                          <div className="mt-auto pt-1">
                            <span className="text-[10px] text-muted-foreground">{totalHours}h</span>
                          </div>
                        )}
                        {blocked && day.isCurrentMonth && (
                          <div className="mt-auto pt-1">
                            <span className="text-[10px] font-medium text-muted-foreground">Off</span>
                          </div>
                        )}
                      </div>
                    )

                    return (
                      <td
                        key={dayIndex}
                        title={blocked ? nonWorkInfo(day.date)?.label : undefined}
                        className={`h-24 border-r border-border p-2 align-top transition-all last:border-r-0 ${
                          blocked
                            ? "cursor-not-allowed bg-muted/40 dark:bg-muted/25"
                            : isToday
                              ? "cursor-pointer bg-primary/5 dark:bg-primary/10 hover:bg-primary/5 dark:hover:bg-primary/10"
                              : "cursor-pointer hover:bg-primary/5 dark:hover:bg-primary/10"
                        }`}
                        onClick={() => tryOpenDay(day.date, week.weekNumber)}
                      >
                        {hasPopoverContent ? (
                          <CalendarDayHoverCard
                            title={formatDate(day.date)}
                            badge={`S${week.weekNumber}`}
                            subtitle={
                              blocked
                                ? "Jour non ouvré"
                                : `${totalHours}h travaillees`
                            }
                            events={events}
                            totalHours={blocked ? 0 : totalHours}
                            side="right"
                            align="start"
                            width="w-80"
                            onEventClick={(evt) => {
                              if (evt.type === "holiday") return
                              tryOpenDay(day.date, week.weekNumber)
                            }}
                          >
                            {cellContent}
                          </CalendarDayHoverCard>
                        ) : (
                          cellContent
                        )}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
