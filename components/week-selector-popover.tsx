"use client"

import { useMemo, useState } from "react"
import type { WeekData } from "@/contexts/timesheet-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, ChevronDown, Search } from "lucide-react"
import { cn } from "@/lib/utils"

type PeriodFilter = "all" | "current_future" | "past"

function weekCategory(w: WeekData, currentWeekNumber: number): "past" | "current" | "future" {
  if (w.isCurrent) return "current"
  if (w.weekNumber < currentWeekNumber) return "past"
  return "future"
}

/** Extrait le libellé mois du champ startDate (ex. "06 oct" → "oct") */
function monthTokenFromStartDate(startDate: string): string {
  const m = startDate.replace(/^\.+/, "").match(/\d+\s+([^\s.]+)/)
  return m ? m[1].trim().toLowerCase() : ""
}

function yearFromStartDate(startDate: string): string {
  const m = startDate.match(/\b(20[0-9]{2})\b/)
  return m ? m[1] : "2026"
}

const MONTH_ORDER: string[] = [
  "janv", "févr", "mars", "avr", "mai", "juin",
  "juil", "aoû", "sep", "oct", "nov", "déc",
]

function sortMonthTokens(tokens: string[]) {
  return [...new Set(tokens)].sort((a, b) => {
    const ia = MONTH_ORDER.findIndex((m) => a.startsWith(m.slice(0, 3)))
    const ib = MONTH_ORDER.findIndex((m) => b.startsWith(m.slice(0, 3)))
    if (ia === -1 && ib === -1) return a.localeCompare(b)
    if (ia === -1) return 1
    if (ib === -1) return -1
    return ia - ib
  })
}

interface WeekSelectorPopoverProps {
  weeks: WeekData[]
  selectedWeek: WeekData
  currentWeekNumber: number
  onSelect: (week: WeekData) => void
}

export function WeekSelectorPopover({
  weeks,
  selectedWeek,
  currentWeekNumber,
  onSelect,
}: WeekSelectorPopoverProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [period, setPeriod] = useState<PeriodFilter>("all")
  const [monthKey, setMonthKey] = useState<string>("all")
  const [yearKey, setYearKey] = useState<string>("all")

  const sortedWeeks = useMemo(() => {
    return [...weeks].sort((a, b) => {
      if (a.isCurrent) return -1
      if (b.isCurrent) return 1
      return b.weekNumber - a.weekNumber
    })
  }, [weeks])

  const byPeriod = useMemo(() => {
    return sortedWeeks.filter((w) => {
      const cat = weekCategory(w, currentWeekNumber)
      if (period === "all") return true
      if (period === "current_future") return cat === "current" || cat === "future"
      return cat === "past"
    })
  }, [sortedWeeks, period, currentWeekNumber])

  const monthOptions = useMemo(() => {
    const tokens = byPeriod.map((w) => monthTokenFromStartDate(w.startDate)).filter(Boolean)
    return sortMonthTokens(tokens)
  }, [byPeriod])

  const yearOptions = useMemo(() => {
    const ys = byPeriod.map((w) => yearFromStartDate(w.startDate))
    return [...new Set(ys)].sort().reverse()
  }, [byPeriod])

  const filteredList = useMemo(() => {
    const q = search.trim().toLowerCase()
    return byPeriod.filter((w) => {
      if (yearKey !== "all" && yearFromStartDate(w.startDate) !== yearKey) return false
      if (monthKey !== "all") {
        const tok = monthTokenFromStartDate(w.startDate)
        if (tok !== monthKey) return false
      }
      if (!q) return true
      const hay = `s${w.weekNumber} semaine ${w.weekNumber} ${w.startDate} ${w.endDate}`.toLowerCase()
      return hay.includes(q)
    })
  }, [byPeriod, monthKey, yearKey, search])

  const triggerLabel = `S${selectedWeek.weekNumber} · ${selectedWeek.startDate} – ${selectedWeek.endDate}`

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="h-9 w-full min-w-0 justify-between gap-2 px-3 font-semibold text-sm border-border shadow-sm hover:bg-muted/50"
          aria-label="Choisir une semaine"
        >
          <span className="flex items-center gap-2 min-w-0 truncate">
            <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{triggerLabel}</span>
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(calc(100vw-2rem),22rem)] p-0" align="start" sideOffset={6}>
        <div className="border-b border-border px-3 py-2.5 space-y-2 bg-muted/20">
          <p className="text-xs font-semibold text-foreground">Choisir une semaine</p>
          <div className="flex flex-wrap gap-1">
            {(
              [
                { id: "all" as const, label: "Toutes" },
                { id: "current_future" as const, label: "En cours & à venir" },
                { id: "past" as const, label: "Passées" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setPeriod(opt.id)
                  setMonthKey("all")
                  setYearKey("all")
                }}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors border",
                  period === opt.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-transparent bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="N° semaine, dates…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 text-xs"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Select value={yearKey} onValueChange={setYearKey}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Année" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">
                  Toutes les années
                </SelectItem>
                {yearOptions.map((y) => (
                  <SelectItem key={y} value={y} className="text-xs">
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={monthKey} onValueChange={setMonthKey}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Mois" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">
                  Tous les mois
                </SelectItem>
                {monthOptions.map((m) => (
                  <SelectItem key={m} value={m} className="text-xs capitalize">
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <ScrollArea className="h-[min(280px,45vh)]">
          <div className="p-1.5 space-y-0.5">
            {filteredList.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8 px-2">
                Aucune semaine ne correspond aux filtres.
              </p>
            ) : (
              filteredList.map((w) => {
                const cat = weekCategory(w, currentWeekNumber)
                const selected = w.id === selectedWeek.id
                const statusLabel =
                  cat === "past"
                    ? "Passée"
                    : cat === "current"
                      ? "En cours"
                      : "À venir"
                const statusVariant =
                  cat === "past"
                    ? "outline text-muted-foreground border-border"
                    : cat === "current"
                      ? "outline border-amber-400/60 text-amber-800 dark:text-amber-300"
                      : "outline border-sky-400/50 text-sky-800 dark:text-sky-300"

                return (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => {
                      onSelect(w)
                      setOpen(false)
                    }}
                    className={cn(
                      "w-full text-left rounded-md px-2.5 py-2 transition-colors border border-transparent",
                      selected
                        ? "bg-primary/10 border-primary/20"
                        : "hover:bg-muted/80",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground leading-tight">
                          Semaine {w.weekNumber}
                          <span className="font-normal text-muted-foreground">
                            {" "}
                            · {w.startDate} – {w.endDate}
                          </span>
                        </p>
                        {cat === "past" && (
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Semaine déjà écoulée — saisie ou contrôle selon les règles RH.
                          </p>
                        )}
                      </div>
                      <Badge variant="outline" className={cn("text-[10px] shrink-0 font-normal border", statusVariant)}>
                        {statusLabel}
                      </Badge>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
