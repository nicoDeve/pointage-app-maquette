"use client"

import { useMemo, useState } from "react"
import type { WeekData } from "@/contexts/timesheet-context"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

function weekCategory(w: WeekData, currentWeekNumber: number): "past" | "current" | "future" {
  if (w.isCurrent) return "current"
  if (w.weekNumber < currentWeekNumber) return "past"
  return "future"
}

interface WeekSelectorPopoverProps {
  /** Semaines déjà filtrées par les filtres globaux (mois, période, projet, absences) — pas de second filtre mois ici */
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

  const sortedWeeks = useMemo(() => {
    return [...weeks].sort((a, b) => {
      if (a.isCurrent) return -1
      if (b.isCurrent) return 1
      return b.weekNumber - a.weekNumber
    })
  }, [weeks])

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
        <div className="border-b border-border px-3 py-2.5 bg-muted/20">
          <p className="text-xs font-semibold text-foreground">Choisir une semaine</p>
          <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
            Les filtres (mois, période, projet…) sont ceux de la barre en haut de la page.
          </p>
        </div>

        <ScrollArea className="h-[min(280px,45vh)]">
          <div className="p-1.5 space-y-0.5">
            {sortedWeeks.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8 px-2">
                Aucune semaine ne correspond aux filtres actuels. Ajustez les filtres en haut.
              </p>
            ) : (
              sortedWeeks.map((w) => {
                const cat = weekCategory(w, currentWeekNumber)
                const selected = w.id === selectedWeek.id
                const statusLabel =
                  cat === "past" ? "Passée" : cat === "current" ? "En cours" : "À venir"
                const statusVariant =
                  cat === "past"
                    ? "outline text-muted-foreground border-border"
                    : cat === "current"
                      ? "outline border-blue-400/60 text-blue-800 dark:border-blue-500/50 dark:text-blue-300"
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
                      selected ? "bg-primary/10 border-primary/20" : "hover:bg-muted/80",
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
                        {/* {cat === "past" && (
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Semaine déjà écoulée — saisie ou contrôle selon les règles RH.
                          </p>
                        )} */}
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
