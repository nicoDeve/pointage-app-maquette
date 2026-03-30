"use client"

import { useEffect, useRef, useState } from "react"
import type { DateRange } from "react-day-picker"
import type { Matcher } from "react-day-picker"
import { getDefaultClassNames } from "react-day-picker"
import { format, startOfMonth } from "date-fns"
import { fr as frLocale } from "date-fns/locale"
import type { Locale } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover"
import { getAppToday } from "@/lib/app-today"
import { cn } from "@/lib/utils"
import { CalendarRange } from "lucide-react"

export type DateRangePickerValue = { from?: Date; to?: Date }

export interface DateRangePickerProps {
  value: DateRangePickerValue
  onChange: (next: DateRangePickerValue) => void
  disabled?: Matcher | Matcher[]
  locale?: Locale
  defaultMonth?: Date
  align?: "start" | "center" | "end"
  className?: string
  triggerClassName?: string
  footerHint?: string
  /** Libellé champ début (vide) */
  startPlaceholder?: string
  /** Libellé champ fin (vide) */
  endPlaceholder?: string
}

/**
 * Plage de dates façon shadcn / v0 : deux champs compacts, calendrier `w-auto` sans bidouille de largeur Radix.
 * 1er clic = début, 2e clic = fin (mode range du Calendar).
 */
export function DateRangePicker({
  value,
  onChange,
  disabled,
  locale = frLocale,
  defaultMonth,
  align = "start",
  className,
  triggerClassName,
  footerHint,
  startPlaceholder = "Début",
  endPlaceholder = "Fin",
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false)
  const [month, setMonth] = useState<Date>(() =>
    startOfMonth(value.from ?? defaultMonth ?? new Date()),
  )

  useEffect(() => {
    if (value.from) {
      setMonth(startOfMonth(value.from))
    }
  }, [value.from])

  const hadRangeRef = useRef(!!value.from || !!value.to)
  useEffect(() => {
    const hasRange = !!value.from || !!value.to
    if (!hasRange && hadRangeRef.current) {
      setMonth(startOfMonth(defaultMonth ?? getAppToday()))
    }
    hadRangeRef.current = hasRange
  }, [value.from, value.to, defaultMonth])

  const selected: DateRange | undefined = value.from
    ? { from: value.from, to: value.to }
    : undefined

  const handleSelect = (range: DateRange | undefined) => {
    if (!range) {
      onChange({})
      return
    }
    onChange({ from: range.from, to: range.to })
    if (range.from && !range.to) {
      setMonth(startOfMonth(range.from))
    } else if (range.to) {
      setMonth(startOfMonth(range.to))
    }
  }

  const d = getDefaultClassNames()
  const calendarClassNames = {
    outside: cn("opacity-[0.35] text-muted-foreground/65", d.outside),
    disabled: cn("opacity-45 cursor-not-allowed text-muted-foreground", d.disabled),
  }

  const openPicker = () => setOpen(true)

  const startLabel = value.from
    ? format(value.from, "P", { locale })
    : null
  const endLabel = value.to ? format(value.to, "P", { locale }) : null

  return (
    <div className={cn("space-y-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverAnchor asChild>
          <div
            className={cn(
              "flex w-full max-w-full items-center gap-2",
              triggerClassName,
            )}
          >
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 min-w-0 flex-1 justify-start gap-0 px-3 text-left font-normal"
              onClick={openPicker}
              aria-expanded={open}
              aria-haspopup="dialog"
            >
              {startLabel ? (
                <span className="truncate text-sm tabular-nums">{startLabel}</span>
              ) : (
                <span className="truncate text-sm text-muted-foreground">
                  {startPlaceholder}
                </span>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 min-w-0 flex-1 justify-start gap-0 px-3 text-left font-normal"
              onClick={openPicker}
              aria-expanded={open}
              aria-haspopup="dialog"
            >
              {endLabel ? (
                <span className="truncate text-sm tabular-nums">{endLabel}</span>
              ) : (
                <span className="truncate text-sm text-muted-foreground">
                  {endPlaceholder}
                </span>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={openPicker}
              aria-label="Ouvrir le calendrier"
              aria-expanded={open}
              aria-haspopup="dialog"
            >
              <CalendarRange className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        </PopoverAnchor>
        <PopoverContent
          align={align}
          sideOffset={6}
          collisionPadding={16}
          className="w-auto max-w-[calc(100vw-2rem)] border-border p-0 shadow-md"
        >
          <Calendar
            mode="range"
            numberOfMonths={1}
            month={month}
            onMonthChange={setMonth}
            selected={selected}
            onSelect={handleSelect}
            disabled={disabled}
            locale={locale}
            classNames={calendarClassNames}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      {footerHint ? (
        <p className="text-xs text-muted-foreground leading-relaxed">{footerHint}</p>
      ) : null}
    </div>
  )
}
