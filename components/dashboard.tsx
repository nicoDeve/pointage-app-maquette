"use client"

import { useMemo, useState } from "react"
import { useTimesheet } from "@/contexts/timesheet-context"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AppSidePanel } from "@/components/app-side-panel"
import { Separator } from "@/components/ui/separator"
import {
  getSupportTeamProjectHoursByMonth,
  SUPPORT_REPORT_MONTH_PERIODS,
} from "@/components/support-view"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { AbsenceStatusBadge, AbsenceTypeBadge, WeekHoursStatusBadge } from "@/components/app-badges"
import { AppPanelKind } from "@/lib/app-enums"
import { AppLabel } from "@/lib/app-labels"
import { uiDensity } from "@/lib/ui-density"
import { cn } from "@/lib/utils"
import {
  Clock,
  Palmtree,
  CalendarCheck,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"

const TEAM_PROJECT_COLORS = ["#6366f1", "#0ea5e9", "#8b5cf6", "#f59e0b", "#10b981", "#f97316", "#22c55e"]

interface DashboardProps {
  onNavigate: (view: string, openPanel?: boolean) => void
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { weeks, absences, getTotalHoursThisMonth, getCompletedWeeksCount, getPendingAbsencesCount, getCongesBalance } =
    useTimesheet()

  const [teamProjectMonthId, setTeamProjectMonthId] = useState<string>(
    SUPPORT_REPORT_MONTH_PERIODS.find((m) => m.isCurrent)?.id ?? SUPPORT_REPORT_MONTH_PERIODS[0]?.id ?? "2026-10",
  )
  const [demandesSheetOpen, setDemandesSheetOpen] = useState(false)

  const teamProjectRows = useMemo(() => getSupportTeamProjectHoursByMonth(teamProjectMonthId), [teamProjectMonthId])
  const teamProjectTotal = teamProjectRows.reduce((s, r) => s + r.hours, 0)
  const teamProjectMax = Math.max(...teamProjectRows.map((r) => r.hours), 1)
  const teamMonthLabel = SUPPORT_REPORT_MONTH_PERIODS.find((m) => m.id === teamProjectMonthId)?.label ?? ""

  const hoursThisMonth = getTotalHoursThisMonth()
  const targetMonthlyHours = 140
  const monthProgress = Math.min((hoursThisMonth / targetMonthlyHours) * 100, 100)
  const completedWeeks = getCompletedWeeksCount()
  const pendingAbsences = getPendingAbsencesCount()
  const congesBalance = getCongesBalance()
  const congesRestants = Math.max(0, congesBalance.total - congesBalance.used)
  const congesConsommePct = Math.min(100, (congesBalance.used / Math.max(congesBalance.total, 1)) * 100)

  const approvedAbsencesCount = absences.filter((a) => a.status === "approuvee").length
  const pendingAbsencesList = absences.filter((a) => a.status === "en_attente")
  const currentWeek = weeks.find((w) => w.isCurrent)

  const weeklyPreview = useMemo(() => {
    const sorted = [...weeks].sort((a, b) => a.weekNumber - b.weekNumber)
    const idx = sorted.findIndex((w) => w.isCurrent)
    const end = idx >= 0 ? idx + 1 : sorted.length
    const start = Math.max(0, end - 4)
    return sorted.slice(start, end)
  }, [weeks])

  return (
    <div className={uiDensity.pageStack}>
      <div className={cn("grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4", uiDensity.gridGap)}>
        <Card className="gap-0 border border-border py-0 shadow-sm">
          <CardContent className={cn(uiDensity.cardPad, "space-y-2")}>
            <div className="flex items-center justify-between gap-2">
              <span className={uiDensity.kpiLabel}>Heures cumulées (mois)</span>
              <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className={uiDensity.kpiValue}>{hoursThisMonth}</span>
              <span className="text-xs text-muted-foreground">h</span>
            </div>
            <Progress value={monthProgress} className="h-1 bg-muted [&>div]:bg-blue-500" />
            <p className={uiDensity.kpiHint}>Objectif indicatif {targetMonthlyHours}h</p>
          </CardContent>
        </Card>

        <Card className="gap-0 border border-border py-0 shadow-sm">
          <CardContent className={cn(uiDensity.cardPad, "space-y-2")}>
            <div className="flex items-center justify-between gap-2">
              <span className={uiDensity.kpiLabel}>Semaines complètes</span>
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className={uiDensity.kpiValue}>{completedWeeks}</span>
              <span className="text-xs text-muted-foreground">/ {weeks.length}</span>
            </div>
            <Progress
              value={(completedWeeks / Math.max(weeks.length, 1)) * 100}
              className="h-1 bg-muted [&>div]:bg-emerald-500"
            />
            <p className={uiDensity.kpiHint}>{currentWeek ? `Courante : S${currentWeek.weekNumber}` : "—"}</p>
          </CardContent>
        </Card>

        <Card className="gap-0 border border-border py-0 shadow-sm">
          <CardContent className={cn(uiDensity.cardPad, "space-y-2")}>
            <div className="flex items-center justify-between gap-2">
              <span className={uiDensity.kpiLabel}>Absences</span>
              <AlertCircle className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className={uiDensity.kpiValue}>{pendingAbsences}</span>
              <span className="text-xs text-muted-foreground">en attente</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className={uiDensity.kpiHint}>{approvedAbsencesCount} approuv.</span>
              {pendingAbsences > 0 && (
                <Button variant="link" className="h-auto p-0 text-[11px]" onClick={() => setDemandesSheetOpen(true)}>
                  Détail
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="gap-0 border border-border py-0 shadow-sm">
          <CardContent className={cn(uiDensity.cardPad, "space-y-2")}>
            <div className="flex items-center justify-between gap-2">
              <span className={uiDensity.kpiLabel}>Congés payés</span>
              <Palmtree className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className={uiDensity.kpiValue}>{congesRestants}</span>
              <span className="text-xs text-muted-foreground">j / {congesBalance.total}j</span>
            </div>
            <Progress value={congesConsommePct} className="h-1 bg-muted [&>div]:bg-violet-500" />
            <p className={uiDensity.kpiHint}>
              {congesBalance.used.toLocaleString("fr-FR", { maximumFractionDigits: 1 })}j utilisés
            </p>
          </CardContent>
        </Card>
      </div>

      <ChartAreaInteractive weeks={weeks} />

      <div className={cn("grid grid-cols-1 items-stretch lg:grid-cols-2", uiDensity.gridGap)}>
        <Card
          className="group cursor-pointer gap-0 border border-border py-0 shadow-sm transition-colors hover:border-primary/40"
          onClick={() => onNavigate("pointage")}
        >
          <CardContent className={cn(uiDensity.cardPad, "space-y-2")}>
            <div className="flex items-center justify-between gap-2">
              <span className={uiDensity.kpiLabel}>Aperçu hebdomadaire</span>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </div>
            <div className="space-y-1.5">
              {weeklyPreview.map((week) => {
                const pct = (week.totalHours / Math.max(week.targetHours, 1)) * 100
                return (
                  <div key={week.id} className="flex items-center gap-2">
                    <span className="w-8 shrink-0 text-xs font-medium tabular-nums text-foreground">S{week.weekNumber}</span>
                    <span className="w-[4.5rem] shrink-0 text-[11px] tabular-nums text-muted-foreground">
                      {week.totalHours}h/{week.targetHours}h
                    </span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full transition-all ${
                          week.status === "complet" ? "bg-emerald-500" : "bg-amber-500"
                        }`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                    <WeekHoursStatusBadge status={week.status} className="max-w-[6rem] shrink-0 truncate" />
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card
          className="group cursor-pointer gap-0 border border-border py-0 shadow-sm transition-colors hover:border-primary/40"
          onClick={() => onNavigate("absence")}
        >
          <CardContent className={cn(uiDensity.cardPad, "space-y-2")}>
            <div className="flex items-center justify-between gap-2">
              <span className={uiDensity.kpiLabel}>Demandes en attente</span>
              <div className="flex shrink-0 items-center gap-1">
                {pendingAbsencesList.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-[11px]"
                    onClick={(e) => {
                      e.stopPropagation()
                      setDemandesSheetOpen(true)
                    }}
                  >
                    Liste
                  </Button>
                )}
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>
            {pendingAbsencesList.length > 0 ? (
              <>
                <div className="divide-y divide-border rounded-md border border-border">
                  {pendingAbsencesList.slice(0, 4).map((absence) => (
                    <div key={absence.id} className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 px-2 py-1.5">
                      <span className="text-xs font-medium text-foreground">{absence.typeLabel}</span>
                      <span className="text-[11px] tabular-nums text-muted-foreground">
                        {absence.startDate} → {absence.endDate} · {absence.duration}j
                      </span>
                    </div>
                  ))}
                </div>
                {pendingAbsencesList.length > 4 && (
                  <p className="text-center text-[11px] text-muted-foreground">+{pendingAbsencesList.length - 4}</p>
                )}
              </>
            ) : (
              <p className="text-xs text-muted-foreground">Rien en attente.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className={cn("grid grid-cols-1 items-stretch lg:grid-cols-2", uiDensity.gridGap)}>
        <Card className="gap-0 border border-border py-0 shadow-sm">
          <CardContent className={cn(uiDensity.cardPad, "space-y-2")}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-1">
                <span className={uiDensity.kpiLabel}>Heures par projet</span>
                <p className={uiDensity.kpiHint}>
                  {teamMonthLabel}
                  {teamProjectTotal > 0 ? ` · ${teamProjectTotal}h` : ""}
                </p>
              </div>
              <Select value={teamProjectMonthId} onValueChange={setTeamProjectMonthId}>
                <SelectTrigger className="h-8 w-full shrink-0 bg-background text-xs sm:w-[min(100%,11rem)]">
                  <SelectValue placeholder="Mois" />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORT_REPORT_MONTH_PERIODS.map((m) => (
                    <SelectItem key={m.id} value={m.id} className="text-xs">
                      {m.label}
                      {m.isCurrent ? " · courant" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
            {teamProjectRows.length === 0 ? (
              <p className="text-xs text-muted-foreground">Aucune heure ce mois.</p>
            ) : (
              <>
                {teamProjectRows.map((row, i) => (
                  <div key={row.name}>
                    <div className="mb-1 flex justify-between gap-2 text-xs">
                      <span className="flex min-w-0 items-center gap-1.5 truncate text-foreground">
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-sm"
                          style={{ backgroundColor: TEAM_PROJECT_COLORS[i % TEAM_PROJECT_COLORS.length] }}
                        />
                        {row.name}
                      </span>
                      <span className="shrink-0 font-medium tabular-nums">{row.hours}h</span>
                    </div>
                    <Progress
                      value={(row.hours / teamProjectMax) * 100}
                      className="h-1 bg-muted"
                      indicatorClassName="bg-transparent"
                      indicatorStyle={{ backgroundColor: TEAM_PROJECT_COLORS[i % TEAM_PROJECT_COLORS.length] }}
                    />
                  </div>
                ))}
                <Separator className="my-1" />
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-foreground">Total</span>
                  <span className="tabular-nums text-foreground">{teamProjectTotal}h</span>
                </div>
              </>
            )}
            </div>
          </CardContent>
        </Card>

        <Card className="gap-0 border border-border py-0 shadow-sm">
          <CardContent className={cn(uiDensity.cardPad, "space-y-2")}>
            <div className="flex items-center justify-between gap-2">
              <span className={uiDensity.kpiLabel}>Actions rapides</span>
            </div>
            <Button
              variant="outline"
              className="h-auto min-h-0 w-full justify-start gap-2 border-border px-2 py-2 text-left font-normal hover:bg-muted/60"
              onClick={() => onNavigate("pointage", true)}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
                <Clock className="h-3.5 w-3.5 text-foreground" />
              </span>
              <span className="min-w-0 flex-1 text-xs font-medium text-foreground">Saisir mes heures</span>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </Button>
            <Button
              variant="outline"
              className="h-auto min-h-0 w-full justify-start gap-2 border-border px-2 py-2 text-left font-normal hover:bg-muted/60"
              onClick={() => onNavigate("absence", true)}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
                <CalendarCheck className="h-3.5 w-3.5 text-foreground" />
              </span>
              <span className="min-w-0 flex-1 text-xs font-medium text-foreground">Nouvelle absence</span>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </Button>
          </CardContent>
        </Card>
      </div>

      <AppSidePanel
        open={demandesSheetOpen}
        onOpenChange={setDemandesSheetOpen}
        panelKind={AppPanelKind.DashboardAbsencesSheet}
        title={AppLabel.absence.sheetTitle}
        description={AppLabel.absence.sheetSubtitle}
        footer={
          <Button
            className="h-9 w-full text-xs"
            size="sm"
            onClick={() => {
              setDemandesSheetOpen(false)
              onNavigate("absence", true)
            }}
          >
            {AppLabel.absence.newRequest}
          </Button>
        }
      >
        {absences.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted-foreground">{AppLabel.absence.emptyList}</p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border bg-muted/5">
            {absences.map((a) => (
              <li
                key={a.id}
                className={cn("px-3 py-2", a.status === "en_attente" && "bg-amber-500/[0.07]")}
              >
                <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                  <AbsenceTypeBadge label={a.typeLabel} className="max-w-[min(100%,11rem)] truncate" />
                  <AbsenceStatusBadge status={a.status} />
                </div>
                <div className="mt-1 flex flex-wrap items-baseline justify-between gap-2 text-[11px] text-muted-foreground">
                  <span>
                    {a.startDate} → {a.endDate}
                  </span>
                  <span className="shrink-0 tabular-nums font-medium text-foreground">
                    {a.duration.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} j
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </AppSidePanel>
    </div>
  )
}
