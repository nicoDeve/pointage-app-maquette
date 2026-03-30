"use client"

import { useState, useMemo, useCallback, type ReactNode } from "react"
import { useTimesheet, Absence } from "@/contexts/timesheet-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AppSidePanel } from "@/components/app-side-panel"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DateRangePicker } from "@/components/date-range-picker"
import { AbsenceStatusBadge, AbsenceTypeBadge } from "@/components/app-badges"
import { uiDensity } from "@/lib/ui-density"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Activity, AlertTriangle, Home, Loader2, Palmtree, Info, Plus, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { useFrenchPublicHolidays } from "@/hooks/use-french-public-holidays"
import { countFrWorkingDaysInRange } from "@/lib/working-days-fr"
import { getAppToday } from "@/lib/app-today"
import { toLocalDateKey, isWeekendFr } from "@/lib/date-keys"
import { cn } from "@/lib/utils"
import { notifyDeleted, notifySaved } from "@/lib/notify"
import { AppPanelKind, AbsenceListFilter, AbsenceTypeCode } from "@/lib/app-enums"
import { AppLabel } from "@/lib/app-labels"
import { appSidePanelTokens } from "@/lib/app-side-panel-tokens"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"

/** Base RH : 1 jour ouvré = 7 h (soldes congés, équivalences affichées). */
const HOURS_PER_WORKDAY = 7

function durationUnitLabel(days: number): string {
  if (days <= 0) return "jours ouvrés"
  if (days === 1) return "jour ouvré"
  if (days > 0 && days < 1) return "jour ouvré"
  return "jours ouvrés"
}

/** Pastille (i) + infobulle — détails au survol, interface allégée. */
function InlineHelp({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Tooltip delayDuration={250}>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="inline-flex size-5 shrink-0 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          aria-label={label}
        >
          <Info className="size-3" strokeWidth={2.5} />
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="max-w-[min(18rem,calc(100vw-2rem))] px-3 py-2 text-left text-xs font-normal leading-relaxed text-balance"
      >
        {children}
      </TooltipContent>
    </Tooltip>
  )
}

interface AbsencesViewProps {
  openDetail?: boolean
  absenceType?: string
  openPanelOnMount?: boolean
  onPanelClose?: () => void
}

export function AbsencesView({ openDetail = false, absenceType: initialType, openPanelOnMount, onPanelClose }: AbsencesViewProps) {
  const { absences, addAbsence, removeAbsence, getCongesBalance } = useTimesheet()
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(Boolean(openDetail || openPanelOnMount))
  const [absenceType, setAbsenceType] = useState<string>(initialType || "")
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [isHalfDay, setIsHalfDay] = useState(false)
  const [motif, setMotif] = useState("")
  const [filter, setFilter] = useState<AbsenceListFilter>(AbsenceListFilter.All)

  const congesBalance = getCongesBalance()
  const congesPayesUsed = absences.filter(a => a.type === "conges_payes").reduce((sum, a) => sum + a.duration, 0)
  const congesPayesRemaining = congesBalance.total - congesPayesUsed
  const congesPayesRemainingHours = congesPayesRemaining * HOURS_PER_WORKDAY
  const absencesCount = absences.filter(a => a.type !== "conges_payes").reduce((sum, a) => sum + a.duration, 0)
  const absencesHours = absencesCount * HOURS_PER_WORKDAY

  const absenceTypes = [
    { value: AbsenceTypeCode.CongesPayes, label: AppLabel.absence.typeCongesPayes, color: "#8b5cf6" },
    { value: AbsenceTypeCode.Teletravail, label: AppLabel.absence.typeTeletravail, color: "#0ea5e9" },
    { value: AbsenceTypeCode.Maladie, label: AppLabel.absence.typeMaladie, color: "#ef4444" },
    { value: AbsenceTypeCode.SansSolde, label: AppLabel.absence.typeSansSolde, color: "#6b7280" },
  ] as const

  // Soldes TT (mock : 10j disponibles)
  const ttBalance      = 10
  const ttUsed         = absences.filter(a => a.type === "teletravail").reduce((s, a) => s + a.duration, 0)
  const ttRemaining    = ttBalance - ttUsed

  /** Années chargées pour les fériés (calendrier + calcul), autour de la date app et de la plage choisie. */
  const holidayYears = useMemo(() => {
    const s = new Set<number>()
    const y0 = getAppToday().getFullYear()
    for (let d = -1; d <= 2; d++) s.add(y0 + d)
    if (startDate) s.add(startDate.getFullYear())
    if (endDate) s.add(endDate.getFullYear())
    return [...s].sort((a, b) => a - b)
  }, [startDate, endDate])

  const frenchHolidays = useFrenchPublicHolidays(holidayYears)

  const holidayKeySet = useMemo(() => {
    const s = new Set<string>()
    for (const y of holidayYears) {
      const m = frenchHolidays.maps.get(y)
      if (m) for (const k of m.keys()) s.add(k)
    }
    return s
  }, [holidayYears, frenchHolidays.maps])

  /** Jours ouvrés bruts sur l’intervalle (sans prise en compte de la demi-journée). */
  const fullWorkingDaysInRange = useMemo(() => {
    if (!startDate || !endDate) return 0
    return countFrWorkingDaysInRange(startDate, endDate, holidayKeySet)
  }, [startDate, endDate, holidayKeySet])

  /**
   * Durée déduite du solde (jours ouvrés).
   * Sans demi-journée : tous les jours ouvrés ; avec : ½ jour sur une date, ou total −½ sur une plage.
   */
  const requestedWorkingDays = useMemo(() => {
    if (!startDate || !endDate) return 0
    const raw = fullWorkingDaysInRange
    if (raw <= 0) return 0
    if (!isHalfDay) return raw
    const sameCalDay = startDate.toDateString() === endDate.toDateString()
    if (sameCalDay) return 0.5
    return Math.max(0.5, raw - 0.5)
  }, [startDate, endDate, fullWorkingDaysInRange, isHalfDay])

  const requestedHours = requestedWorkingDays * HOURS_PER_WORKDAY

  const isRangeDayDisabled = useCallback(
    (date: Date) => isWeekendFr(date) || holidayKeySet.has(toLocalDateKey(date)),
    [holidayKeySet],
  )

  const handleSubmit = () => {
    if (absenceType && startDate && endDate) {
      const typeInfo = absenceTypes.find(t => t.value === absenceType)
      addAbsence({
        type: absenceType as Absence["type"],
        typeLabel: typeInfo?.label || absenceType,
        startDate: format(startDate, "d MMM.", { locale: fr }),
        endDate: format(endDate, "d MMM. yyyy", { locale: fr }),
        duration: requestedWorkingDays,
        status: "en_attente",
      })
      setIsDetailOpen(false)
      resetForm()
      notifySaved(AppLabel.absence.toastRequestSavedTitle, AppLabel.absence.toastRequestSavedDesc)
    }
  }

  const resetForm = () => {
    setAbsenceType("")
    setStartDate(undefined)
    setEndDate(undefined)
    setIsHalfDay(false)
    setMotif("")
  }

  const handleOpenDetail = (type?: string) => {
    resetForm()
    if (type) setAbsenceType(type)
    setIsDetailOpen(true)
  }

  const filteredAbsences =
    filter === AbsenceListFilter.All ? absences : absences.filter((a) => a.status === filter)

  return (
    <div className={uiDensity.pageStack}>
      <div className={cn("grid grid-cols-1 gap-2 sm:grid-cols-3", uiDensity.gridGap)}>
        <Card className="gap-0 border border-border py-0 shadow-sm">
          <CardContent className={cn(uiDensity.cardPad, "space-y-2")}>
            <div className="flex items-center justify-between gap-2">
              <span className={uiDensity.kpiLabel}>{AppLabel.absence.countersCpShort}</span>
              <Palmtree className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className={uiDensity.kpiValue}>{congesPayesRemaining}</span>
              <span className="text-xs text-muted-foreground">j / {congesBalance.total}j</span>
            </div>
            <Progress
              value={(congesPayesUsed / Math.max(congesBalance.total, 1)) * 100}
              className="h-1 bg-muted [&>div]:bg-violet-500"
            />
            <p className={uiDensity.kpiHint}>
              {congesPayesUsed.toLocaleString("fr-FR", { maximumFractionDigits: 1 })}{" "}
              {AppLabel.absence.countersCpUsedHint} · {congesPayesRemainingHours}h
            </p>
          </CardContent>
        </Card>

        <Card className="gap-0 border border-border py-0 shadow-sm">
          <CardContent className={cn(uiDensity.cardPad, "space-y-2")}>
            <div className="flex items-center justify-between gap-2">
              <span className={uiDensity.kpiLabel}>{AppLabel.absence.countersTtShort}</span>
              <Home className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className={uiDensity.kpiValue}>{ttRemaining}</span>
              <span className="text-xs text-muted-foreground">j / {ttBalance}j</span>
            </div>
            <Progress value={(ttUsed / ttBalance) * 100} className="h-1 bg-muted [&>div]:bg-sky-500" />
            <p className={uiDensity.kpiHint}>
              {ttUsed.toLocaleString("fr-FR", { maximumFractionDigits: 1 })}j · {AppLabel.absence.countersTtBalanceHint}
            </p>
          </CardContent>
        </Card>

        <Card className="gap-0 border border-border py-0 shadow-sm sm:col-span-1">
          <CardContent className={cn(uiDensity.cardPad, "space-y-2")}>
            <div className="flex items-center justify-between gap-2">
              <span className={uiDensity.kpiLabel}>{AppLabel.absence.countersOtherShort}</span>
              <Activity className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className={uiDensity.kpiValue}>{absencesCount}</span>
              <span className="text-xs text-muted-foreground">j</span>
            </div>
            <Progress value={Math.min((absencesCount / 20) * 100, 100)} className="h-1 bg-muted [&>div]:bg-red-500" />
            <p className={uiDensity.kpiHint}>
              ≈ {absencesHours}h · {AppLabel.absence.countersOtherHint}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className={cn(uiDensity.sectionTitle, "text-sm sm:text-base")}>{AppLabel.absence.pageRequestsTitle}</h2>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={() => handleOpenDetail()}
              className="h-9 bg-[#18181b] px-3 text-xs text-white hover:bg-[#18181b]/90"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              {AppLabel.absence.addButton}
            </Button>
            <Select value={filter} onValueChange={(v) => setFilter(v as AbsenceListFilter)}>
              <SelectTrigger className="h-9 w-[min(100%,10rem)] text-xs">
                <SelectValue placeholder={AppLabel.absence.filterAll} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={AbsenceListFilter.All} className="text-xs">
                  {AppLabel.absence.filterAll} ({absences.length})
                </SelectItem>
                <SelectItem value={AbsenceListFilter.EnAttente} className="text-xs">
                  {AppLabel.absence.filterPending}
                </SelectItem>
                <SelectItem value={AbsenceListFilter.Approuvee} className="text-xs">
                  {AppLabel.absence.filterApproved}
                </SelectItem>
                <SelectItem value={AbsenceListFilter.Refusee} className="text-xs">
                  {AppLabel.absence.filterRejected}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="border border-border rounded-lg overflow-hidden">

          <div className="divide-y divide-border">
            {filteredAbsences.map((absence) => (
              <ContextMenu key={absence.id}>
                <ContextMenuTrigger asChild>
                  <div
                    className={cn(
                      "grid grid-cols-[1fr_auto_100px] items-center hover:bg-muted/30 transition-colors cursor-default select-none",
                      uiDensity.listRowCompact,
                    )}
                  >
                    {/* Infos */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <AbsenceTypeBadge label={absence.typeLabel} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {absence.startDate} → {absence.endDate}
                      </p>
                    </div>

                    {/* Durée */}
                    <span className="pr-4 text-xs tabular-nums text-foreground">{absence.duration} j</span>

                    {/* Statut */}
                    <div className="flex justify-center">
                      <AbsenceStatusBadge status={absence.status} />
                    </div>
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent className="w-56">
                  {absence.status === "en_attente" ? (
                    <ContextMenuItem
                      variant="destructive"
                      onSelect={() => {
                        removeAbsence(absence.id)
                        notifyDeleted(
                          AppLabel.absence.toastRequestDeletedTitle,
                          AppLabel.absence.toastRequestDeletedDesc,
                        )
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {AppLabel.absence.deleteRequest}
                    </ContextMenuItem>
                  ) : (
                    <ContextMenuItem disabled className="text-muted-foreground">
                      {AppLabel.absence.deleteOnlyPending}
                    </ContextMenuItem>
                  )}
                </ContextMenuContent>
              </ContextMenu>
            ))}

            {filteredAbsences.length === 0 && (
              <div className="py-8 text-center text-xs text-muted-foreground">{AppLabel.absence.requestsEmpty}</div>
            )}
          </div>
        </div>
      </div>

      <AppSidePanel
        open={isDetailOpen}
        onOpenChange={(open) => {
          setIsDetailOpen(open)
          if (!open && onPanelClose) onPanelClose()
        }}
        panelKind={AppPanelKind.AbsenceRequestDetail}
        title={AppLabel.absence.requestFormTitle}
        description={AppLabel.absence.requestFormSubtitle}
        footer={
          <Button
            type="button"
            className="h-9 w-full bg-[#18181b] text-xs text-white hover:bg-[#18181b]/90"
            size="sm"
            onClick={handleSubmit}
            disabled={!absenceType || !startDate || !endDate || requestedWorkingDays <= 0}
          >
            {AppLabel.common.save}
          </Button>
        }
      >
        <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">{AppLabel.absence.fieldType}</label>
              <Select value={absenceType} onValueChange={setAbsenceType}>
                <SelectTrigger className="h-9 w-full text-xs">
                  <SelectValue placeholder={AppLabel.absence.typePlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  {absenceTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value} className="text-xs">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: type.color }} />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <label className="text-xs font-medium text-foreground">{AppLabel.absence.fieldPeriod}</label>
                  <InlineHelp label="Aide — sélection des dates">
                    <p>
                      <strong>Premier clic</strong> : date de début, <strong>second clic</strong> : date de fin. Seuls
                      les <strong>jours ouvrés</strong> sont sélectionnables (week-ends et fériés métropole exclus du
                      calendrier).
                    </p>
                  </InlineHelp>
                </div>
                <DateRangePicker
                  value={{ from: startDate, to: endDate }}
                  onChange={({ from, to }) => {
                    setStartDate(from)
                    setEndDate(to)
                  }}
                  disabled={isRangeDayDisabled}
                  defaultMonth={getAppToday()}
                  locale={fr}
                />
              </div>

              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2">
                <Checkbox
                  id="halfday"
                  checked={isHalfDay}
                  disabled={!startDate || !endDate}
                  onCheckedChange={(checked) => setIsHalfDay(checked === true)}
                />
                <label htmlFor="halfday" className="flex-1 cursor-pointer text-xs font-medium text-foreground">
                  {AppLabel.absence.halfDay}
                </label>
                <InlineHelp label="Aide — demi-journée">
                  <div className="space-y-2">
                    <p>
                      Par défaut, tous les <strong>jours ouvrés</strong> de la plage comptent pour 1 (base{" "}
                      {HOURS_PER_WORKDAY} h / jour).
                    </p>
                    <p>
                      Cochez pour une <strong>demi-journée</strong> : ½ jour sur une date unique, ou −½ jour sur une
                      plage de plusieurs jours ouvrés (départ ou retour).
                    </p>
                  </div>
                </InlineHelp>
              </div>

              {startDate && endDate ? (
                <div className={appSidePanelTokens.summaryBox}>
                  <div className={appSidePanelTokens.summaryHeaderRow}>
                    <div className="flex min-w-0 items-center gap-1.5">
                      <span className={appSidePanelTokens.summaryLabel}>{AppLabel.absence.durationFromBalance}</span>
                      <InlineHelp label="Aide — calcul de la durée">
                        <div className="space-y-2">
                          <p>
                            Jours ouvrés (lun.–ven., hors fériés métropole). Équivalent ≈ durée × {HOURS_PER_WORKDAY}{" "}
                            h.
                          </p>
                          {isHalfDay && fullWorkingDaysInRange > 0 ? (
                            <p>
                              {fullWorkingDaysInRange === 1 &&
                              startDate.toDateString() === endDate.toDateString() ? (
                                <>
                                  <strong>Demi-journée</strong> : <strong>0,5</strong> jour ouvré.
                                </>
                              ) : (
                                <>
                                  <span className="tabular-nums">{fullWorkingDaysInRange.toLocaleString("fr-FR")}</span>{" "}
                                  jour{fullWorkingDaysInRange > 1 ? "s" : ""} ouvré
                                  {fullWorkingDaysInRange > 1 ? "s" : ""}, moins <strong>0,5</strong> jour.
                                </>
                              )}
                            </p>
                          ) : null}
                        </div>
                      </InlineHelp>
                    </div>
                    <div className="shrink-0 text-right">
                      {frenchHolidays.loading ? (
                        <Loader2 className="ml-auto size-4 animate-spin text-muted-foreground" aria-hidden />
                      ) : (
                        <>
                          <span
                            className={
                              requestedWorkingDays > 0
                                ? appSidePanelTokens.summaryValue
                                : appSidePanelTokens.summaryValueMuted
                            }
                          >
                            {requestedWorkingDays.toLocaleString("fr-FR", {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 1,
                            })}
                          </span>
                          <span className="ml-1 text-xs font-normal text-muted-foreground">
                            {durationUnitLabel(requestedWorkingDays)}
                          </span>
                          {requestedWorkingDays > 0 ? (
                            <p className={cn(appSidePanelTokens.summarySub, "mt-0.5")}>
                              ≈{" "}
                              {requestedHours.toLocaleString("fr-FR", {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 1,
                              })}{" "}
                              h
                            </p>
                          ) : null}
                        </>
                      )}
                    </div>
                  </div>

                  {frenchHolidays.error ? (
                    <div className="mt-2 flex gap-2 rounded-md border border-amber-500/20 bg-amber-500/5 px-2 py-1.5 text-[11px] text-amber-800 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-200">
                      <AlertTriangle className="size-3 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                      <span>{frenchHolidays.error}</span>
                    </div>
                  ) : null}

                  {requestedWorkingDays <= 0 &&
                  !frenchHolidays.loading &&
                  !frenchHolidays.error ? (
                    <p className="mt-2 text-[11px] leading-snug text-destructive">
                      Aucun jour ouvré sur cette période.
                      {isHalfDay ? " La demi-journée suppose au moins une journée ouvrée." : ""}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">{AppLabel.absence.fieldMotif}</label>
              <Textarea
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                placeholder={AppLabel.absence.motifPlaceholder}
                className="min-h-[5.5rem] resize-none text-xs"
              />
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2">
              <span className="flex-1 text-xs font-medium text-foreground">{AppLabel.absence.validationProcess}</span>
              <InlineHelp label="Détail du processus de validation">
                <div className="space-y-2">
                  <p>
                    Votre demande est envoyée à votre <strong>référent</strong> pour approbation. Vous serez notifié
                    une fois la décision prise.
                  </p>
                  <p>
                    La durée compte les <strong>jours ouvrés</strong> (lun.–ven.), hors week-ends et fériés{" "}
                    <strong>métropole</strong> (calendrier type data.gouv / Etalab).
                  </p>
                </div>
              </InlineHelp>
            </div>

        </div>
      </AppSidePanel>
    </div>
  )
}
