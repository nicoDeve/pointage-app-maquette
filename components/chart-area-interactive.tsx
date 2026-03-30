"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import type { WeekData } from "@/contexts/timesheet-context"
import { useIsMobile } from "@/hooks/use-mobile"
import { Card, CardContent } from "@/components/ui/card"
import { uiDensity } from "@/lib/ui-density"
import { cn } from "@/lib/utils"
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

type WeekHoursRange = "all" | "8w" | "4w" | "1w"

const RANGE_LABELS: Record<WeekHoursRange, string> = {
  all: "Toutes les semaines",
  "8w": "8 dernières",
  "4w": "4 dernières",
  "1w": "Dernière semaine",
}

const chartConfig = {
  saisi: {
    label: "Heures saisies",
    color: "var(--chart-1)",
  },
  cible: {
    label: "Objectif",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

function sortWeeksChronologically(weeks: WeekData[]) {
  return [...weeks].sort((a, b) => {
    const ay = a.isoWeekYear ?? 0
    const by = b.isoWeekYear ?? 0
    if (ay !== by) return ay - by
    return a.weekNumber - b.weekNumber
  })
}

export interface ChartAreaInteractiveProps {
  weeks: WeekData[]
}

export function ChartAreaInteractive({ weeks }: ChartAreaInteractiveProps) {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState<WeekHoursRange>("all")
  const uid = React.useId().replace(/:/g, "")

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("4w")
    }
  }, [isMobile])

  const sorted = React.useMemo(() => sortWeeksChronologically(weeks), [weeks])

  const filteredData = React.useMemo(() => {
    if (sorted.length === 0) return []
    if (timeRange === "all") return sorted
    const n = timeRange === "8w" ? 8 : timeRange === "4w" ? 4 : 1
    return sorted.slice(-n)
  }, [sorted, timeRange])

  const points = React.useMemo(
    () =>
      filteredData.map((w) => ({
        label: `S${w.weekNumber}`,
        year: w.isoWeekYear,
        saisi: w.totalHours,
        cible: w.targetHours,
      })),
    [filteredData],
  )

  /**
   * Échelle pensée semaine (~35h) : plafond 40h par défaut pour remplir le graph sans « zoom » excessif.
   * Si les données dépassent, on arrondit au multiple de 5 au-dessus + petite marge.
   */
  const yDomain = React.useMemo((): [number, number] => {
    if (points.length === 0) return [0, 40]
    let max = 0
    for (const p of points) {
      max = Math.max(max, p.saisi, p.cible)
    }
    if (max <= 40) return [0, 40]
    const step = 5
    const top = Math.ceil((max + 2) / step) * step
    return [0, Math.max(top, 45)]
  }, [points])

  const onRangeChange = (v: string) => {
    if (v === "all" || v === "8w" || v === "4w" || v === "1w") {
      setTimeRange(v)
    }
  }

  return (
    <Card className="@container/card gap-0 border border-border py-0 shadow-sm">
      <CardContent className={cn(uiDensity.cardPad, "space-y-3")}>
        <div className="flex flex-col gap-2 @[767px]/card:flex-row @[767px]/card:items-start @[767px]/card:justify-between">
          <div className="min-w-0 space-y-1">
            <span className={uiDensity.kpiLabel}>Heures par semaine</span>
            <p className={uiDensity.kpiHint}>
              <span className="hidden @[540px]/card:block">Saisi vs objectif (échelle 0–40h si applicable)</span>
              <span className="@[540px]/card:hidden">Saisi vs objectif</span>
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            <ToggleGroup
              type="single"
              value={timeRange}
              onValueChange={(v) => v && onRangeChange(v)}
              variant="outline"
              className="hidden *:data-[slot=toggle-group-item]:!px-3 @[767px]/card:flex"
            >
              <ToggleGroupItem value="all">Toutes</ToggleGroupItem>
              <ToggleGroupItem value="8w">8 sem.</ToggleGroupItem>
              <ToggleGroupItem value="4w">4 sem.</ToggleGroupItem>
              <ToggleGroupItem value="1w">1 sem.</ToggleGroupItem>
            </ToggleGroup>
            <Select value={timeRange} onValueChange={onRangeChange}>
              <SelectTrigger
                className="h-8 w-[min(100%,11rem)] text-xs @[767px]/card:hidden"
                aria-label="Période du graphique"
              >
                <SelectValue placeholder={RANGE_LABELS.all} />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {(Object.keys(RANGE_LABELS) as WeekHoursRange[]).map((key) => (
                  <SelectItem key={key} value={key} className="rounded-lg text-xs">
                    {RANGE_LABELS[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
        {points.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">Aucune donnée de semaine.</p>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[250px] w-full [&_.recharts-cartesian-axis-tick_text]:text-[10px]"
          >
            <AreaChart
              data={points}
              margin={{ left: 2, right: 2, top: 4, bottom: 0 }}
            >
              <defs>
                <linearGradient id={`fillSaisi-${uid}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-saisi)" stopOpacity={0.9} />
                  <stop offset="95%" stopColor="var(--color-saisi)" stopOpacity={0.08} />
                </linearGradient>
                <linearGradient id={`fillCible-${uid}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-cible)" stopOpacity={0.75} />
                  <stop offset="95%" stopColor="var(--color-cible)" stopOpacity={0.08} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/60" />
              <YAxis
                domain={yDomain}
                width={32}
                tickLine={false}
                axisLine={false}
                tickMargin={4}
                ticks={yDomain[1] <= 40 ? [0, 20, 35, 40] : undefined}
              />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={4}
                minTickGap={16}
                height={28}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value, payload) => {
                      const row = payload?.[0]?.payload as { label?: string; year?: number } | undefined
                      if (row?.year != null) {
                        return `${row.label} (${row.year})`
                      }
                      return String(value)
                    }}
                    indicator="dot"
                  />
                }
              />
              <Area
                dataKey="cible"
                type="monotone"
                fill={`url(#fillCible-${uid})`}
                stroke="var(--color-cible)"
                strokeWidth={1.5}
              />
              <Area
                dataKey="saisi"
                type="monotone"
                fill={`url(#fillSaisi-${uid})`}
                stroke="var(--color-saisi)"
                strokeWidth={1.5}
              />
            </AreaChart>
          </ChartContainer>
        )}
        </div>
      </CardContent>
    </Card>
  )
}
