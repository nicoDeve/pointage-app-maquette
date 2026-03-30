"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useTimesheet } from "@/contexts/timesheet-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Calendar,
  List,
  ChevronRight,
  ChevronLeft,
  Trash2,
  Search,
  Filter,
  X,
  History,
  Plus,
  ArrowLeft,
} from "lucide-react"
import { TimesheetCalendar } from "./timesheet-calendar"
import { WeekHoursStatusBadge } from "@/components/app-badges"
import { uiDensity } from "@/lib/ui-density"
import { WeekSelectorPopover } from "./week-selector-popover"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import type { Absence, DayOfWeek, WeekData } from "@/contexts/timesheet-context"
import { HOURS_PER_WORKDAY, timesheetDayHoursTextClass } from "@/lib/month-iso-weeks"
import { cn } from "@/lib/utils"
import { useFrenchPublicHolidays } from "@/hooks/use-french-public-holidays"
import { TIMESHEET_CALENDAR_SELECT_YEARS } from "@/lib/timesheet-calendar-years"
import { DEMO_ISO_WEEK_YEAR, resolveDisplayTargetHours } from "@/lib/week-target-hours"
import { formatIsoWeekRangeDisplayFr, getIsoWeekWorkdaySlots } from "@/lib/iso-week-workdays"
import {
  collectCalendarMonthKeysFromWeeks,
  weekHasWorkdayInCalendarMonth,
} from "@/lib/week-month-filter"
import { notifyDeleted, notifySaved, notifyUpdated } from "@/lib/notify"
import { AppSidePanel } from "@/components/app-side-panel"
import { AppPanelKind } from "@/lib/app-enums"
import { AppLabel } from "@/lib/app-labels"
import { appSidePanelTokens } from "@/lib/app-side-panel-tokens"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { format, parse } from "date-fns"
import { fr } from "date-fns/locale"

// ── Constantes jours ──────────────────────────────────────────────────────────
const DAY_LABELS: Record<DayOfWeek, string> = {
  lun: "Lundi", mar: "Mardi", mer: "Mercredi", jeu: "Jeudi", ven: "Vendredi",
}

function formatHoursLabel(h: number): string {
  if (h === 0) return "0h"
  const full = Math.floor(h)
  const hasHalf = h % 1 !== 0
  return hasHalf ? `${full}h30` : `${full}h`
}

type ProjectLite = { id: string; name: string }

/** Normalise la requête / le texte indexé : casse, point médian ·, virgules, espaces. */
function normalizeForSearch(s: string): string {
  return s
    .toLowerCase()
    .replace(/[·•]/g, " ")
    .replace(/,/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function textMatchesSearch(haystack: string, rawQuery: string): boolean {
  const q = normalizeForSearch(rawQuery)
  if (!q) return true
  return normalizeForSearch(haystack).includes(q)
}

/** Variantes de libellé pour un jour ouvré (aligné sur les cartes + formes longues). */
function pushDayDateSearchParts(parts: string[], day: DayOfWeek, date: Date, dateKey: string) {
  const dm = format(date, "d MMM.", { locale: fr })
  const dmFull = format(date, "d MMMM yyyy", { locale: fr })
  const eeeeFull = format(date, "EEEE d MMMM yyyy", { locale: fr })
  parts.push(
    `${DAY_LABELS[day]} ${dm}`.toLowerCase(),
    `${DAY_LABELS[day].toLowerCase()} ${dm.toLowerCase()}`,
    `${DAY_LABELS[day]}\u00b7${dm}`.toLowerCase(),
    eeeeFull.toLowerCase(),
    dmFull.toLowerCase(),
    format(date, "d MMM yyyy", { locale: fr }).toLowerCase(),
    format(date, "EEE d MMM yyyy", { locale: fr }).toLowerCase(),
    format(date, "yyyy-MM-dd", { locale: fr }).toLowerCase(),
    dateKey.toLowerCase(),
  )
}

/** Texte indexé par la recherche globale (semaine + entrées + absences + dates civiles des jours). */
function buildWeekSearchText(week: WeekData, projects: ProjectLite[], absences: Absence[]): string {
  const parts: string[] = [
    `semaine ${week.weekNumber}`,
    `s${week.weekNumber}`,
    `s ${week.weekNumber}`,
    `week ${week.weekNumber}`,
    String(week.weekNumber),
    week.startDate.toLowerCase(),
    week.endDate.toLowerCase(),
    week.status,
    week.id,
    ...week.tags.map((t) => t.toLowerCase()),
    `${week.totalHours}h`,
    String(week.totalHours),
    week.projectCount > 0 ? "projet projets activité activités" : "",
    week.absenceCount > 0 ? "absence absences" : "",
    String(week.absenceCount),
    week.isCurrent ? "courante en cours actuelle" : "",
    week.targetHours ? `${week.targetHours}h cible objectif` : "",
  ]
  for (const e of week.entries) {
    const p = projects.find((pr) => pr.id === e.projectId)
    parts.push(DAY_LABELS[e.dayOfWeek].toLowerCase(), e.dayOfWeek)
    if (p) parts.push(p.name.toLowerCase())
    parts.push(formatHoursLabel(e.hours), String(e.hours))
  }
  for (const a of absences) {
    if (a.weekId !== week.id) continue
    parts.push(a.typeLabel.toLowerCase(), a.type, a.status)
    if (a.dayOfWeek) parts.push(DAY_LABELS[a.dayOfWeek].toLowerCase(), a.dayOfWeek)
  }

  const isoY = week.isoWeekYear ?? DEMO_ISO_WEEK_YEAR
  const slots = getIsoWeekWorkdaySlots(isoY, week.weekNumber)
  for (const { day, date, dateKey } of slots) {
    pushDayDateSearchParts(parts, day, date, dateKey)
  }

  return parts.filter(Boolean).join(" ")
}

function daySlotMatchesSearch(
  rawQuery: string,
  day: DayOfWeek,
  date: Date,
  dateKey: string,
  dayEntries: { projectId: string; hours: number }[],
  projects: ProjectLite[],
  dayAbsence: Absence | undefined,
  ferie: string | undefined,
): boolean {
  if (!normalizeForSearch(rawQuery)) return true
  const parts: string[] = [DAY_LABELS[day].toLowerCase(), day]
  pushDayDateSearchParts(parts, day, date, dateKey)
  parts.push(format(date, "d/M/yyyy", { locale: fr }).toLowerCase())
  if (ferie) parts.push(ferie.toLowerCase(), "férié", "ferie")
  if (dayAbsence) {
    parts.push(dayAbsence.typeLabel.toLowerCase(), dayAbsence.type)
  }
  for (const e of dayEntries) {
    const p = projects.find((pr) => pr.id === e.projectId)
    if (p) parts.push(p.name.toLowerCase())
    parts.push(formatHoursLabel(e.hours), String(e.hours))
  }
  return textMatchesSearch(parts.join(" "), rawQuery)
}

// ── Composant input heures +/- ────────────────────────────────────────────────
function HoursInput({ value, onChange, max }: { value: number; onChange: (h: number) => void; max: number }) {
  const snap = (v: number) => Math.round(v * 2) / 2
  const dec  = () => onChange(Math.max(0, snap(value - 0.5)))
  const inc  = () => onChange(Math.min(max, snap(value + 0.5)))
  return (
    <div className="flex items-center border border-border rounded-md overflow-hidden h-8 bg-background flex-shrink-0">
      <button type="button" onClick={dec} disabled={value <= 0}
        className="px-2 h-full text-sm text-muted-foreground hover:bg-muted disabled:opacity-30 transition-colors select-none">
        −
      </button>
      <input
        type="number" step={0.5} min={0} max={max} value={value}
        onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v)) onChange(Math.min(max, Math.max(0, snap(v)))) }}
        className="w-10 text-center text-xs bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button type="button" onClick={inc} disabled={value >= max}
        className="px-2 h-full text-sm text-muted-foreground hover:bg-muted disabled:opacity-30 transition-colors select-none">
        +
      </button>
    </div>
  )
}

interface TimesheetViewProps {
  initialWeekId?: string
  initialDate?: Date
  openPanelOnMount?: boolean
  onPanelClose?: () => void
}

export function TimesheetView({ initialWeekId, initialDate, openPanelOnMount, onPanelClose }: TimesheetViewProps) {
  const {
    weeks,
    projects,
    absences,
    pointageView,
    setPointageView,
    addTimeEntry,
    updateTimeEntry,
    updateTimeEntryProject,
    removeTimeEntry,
  } = useTimesheet()
  const frenchHolidays = useFrenchPublicHolidays([...TIMESHEET_CALENDAR_SELECT_YEARS])
  // Navigation: semaine sélectionnée pour la vue jours
  const [selectedWeek, setSelectedWeek] = useState<WeekData | null>(null)
  // Jour sélectionné pour le panel latéral
  const [selectedDay, setSelectedDay] = useState<DayOfWeek | null>(null)
  const [isDayPanelOpen, setIsDayPanelOpen] = useState(false)

  // Pour openPanelOnMount : naviguer directement vers la vue jours de la semaine cible
  useEffect(() => {
    if (openPanelOnMount && initialWeekId) {
      const week = weeks.find(w => w.id === initialWeekId)
      if (week) setSelectedWeek(week)
    }
  }, [openPanelOnMount, initialWeekId, weeks])
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [filterWeek, setFilterWeek] = useState<string>("all")
  const [filterProject, setFilterProject] = useState<string>("all")
  const [filterHasAbsence, setFilterHasAbsence] = useState<string>("all")
  /** `all` ou `YYYY-MM` : semaines ayant au moins un jour ouvré dans ce mois civil */
  const [filterListMonth, setFilterListMonth] = useState<string>("all")

  const listMonthOptions = useMemo(
    () => collectCalendarMonthKeysFromWeeks(weeks, DEMO_ISO_WEEK_YEAR),
    [weeks],
  )

  // Sort weeks: current first, then future, then past
  const currentWeekNumber = weeks.find(w => w.isCurrent)?.weekNumber || 41
  const isPastWeek = useCallback(
    (weekNumber: number) => weekNumber < currentWeekNumber,
    [currentWeekNumber],
  )

  /** Filtres structuraux (barre « Filtres ») — une seule source de vérité pour liste, calendrier et sélecteur de semaine */
  const weeksMatchingStructuralFilters = useMemo(() => {
    return weeks.filter((week) => {
      if (filterWeek !== "all") {
        if (filterWeek === "current" && !week.isCurrent) return false
        if (filterWeek === "past" && !isPastWeek(week.weekNumber)) return false
        if (filterWeek === "future" && (isPastWeek(week.weekNumber) || week.isCurrent)) return false
      }

      if (filterProject !== "all") {
        if (!week.entries.some((e) => e.projectId === filterProject)) return false
      }

      if (filterHasAbsence !== "all") {
        if (filterHasAbsence === "with" && week.absenceCount === 0) return false
        if (filterHasAbsence === "without" && week.absenceCount > 0) return false
      }

      if (filterListMonth !== "all") {
        const [y, m] = filterListMonth.split("-").map(Number)
        if (!weekHasWorkdayInCalendarMonth(week, y, m - 1, DEMO_ISO_WEEK_YEAR)) return false
      }

      return true
    })
  }, [weeks, filterWeek, filterProject, filterHasAbsence, filterListMonth, isPastWeek])

  const filteredWeeks = useMemo(() => {
    const raw = searchQuery.trim()
    let list = weeksMatchingStructuralFilters
    if (raw) {
      list = list.filter((w) => textMatchesSearch(buildWeekSearchText(w, projects, absences), raw))
    }
    return [...list].sort((a, b) => {
      if (a.isCurrent) return -1
      if (b.isCurrent) return 1
      return b.weekNumber - a.weekNumber
    })
  }, [weeksMatchingStructuralFilters, searchQuery, projects, absences])

  useEffect(() => {
    if (!selectedWeek) return
    const ok = weeksMatchingStructuralFilters.some((w) => w.id === selectedWeek.id)
    if (!ok) setSelectedWeek(null)
  }, [weeksMatchingStructuralFilters, selectedWeek])

  const getWeekStats = (week: WeekData) => {
    const projectCount = week.entries.length
    const absenceCount = week.absenceCount
    return { projectCount, absenceCount }
  }

  const getProjectNames = (week: WeekData) => {
    return week.entries.map(entry => {
      const project = projects.find(p => p.id === entry.projectId)
      return project ? `${project.name}: ${entry.hours}h` : ""
    }).filter(Boolean)
  }

  useEffect(() => {
    if (initialWeekId) {
      const week = weeks.find(w => w.id === initialWeekId)
      if (week) setSelectedWeek(week)
    }
  }, [initialWeekId, weeks])

  useEffect(() => {
    setSelectedWeek((prev) => {
      if (!prev) return prev
      const updated = weeks.find((w) => w.id === prev.id)
      return updated ?? prev
    })
  }, [weeks])

  // Clic semaine → vue jours (pas de panel)
  const handleWeekClick = (week: WeekData) => {
    setSelectedWeek(week)
  }

  const handleBackToWeeks = () => {
    setSelectedWeek(null)
    onPanelClose?.()
  }

  // Clic sur un jour → ouvre le panel
  const handleDayClick = (day: DayOfWeek) => {
    setSelectedDay(day)
    setIsDayPanelOpen(true)
  }

  // Ajouter une activité pour le jour sélectionné (dans le panel)
  const handleAddActivity = () => {
    if (!selectedWeek || !selectedDay || remainingHours <= 0) return
    const dayHours  = selectedWeek.entries.filter(e => e.dayOfWeek === selectedDay).reduce((s, e) => s + e.hours, 0)
    if (dayHours >= HOURS_PER_WORKDAY) return
    const usedIds   = selectedWeek.entries.filter(e => e.dayOfWeek === selectedDay).map(e => e.projectId)
    const available = projects.filter(p => !usedIds.includes(p.id))
    if (available.length === 0) return
    addTimeEntry(selectedWeek.id, {
      projectId: available[0].id,
      hours: Math.min(7 - dayHours, remainingHours),
      dayOfWeek: selectedDay,
    })
  }

  const handleHoursChange = (entryId: string, hours: number) => {
    if (selectedWeek) {
      const cap = resolveDisplayTargetHours(
        selectedWeek,
        frenchHolidays.maps.get(selectedWeek.isoWeekYear ?? DEMO_ISO_WEEK_YEAR),
      )
      const otherHours = selectedWeek.entries
        .filter((e) => e.id !== entryId)
        .reduce((sum, e) => sum + e.hours, 0)
      const capped = Math.min(hours, cap - otherHours)
      updateTimeEntry(selectedWeek.id, entryId, capped)
      notifyUpdated("Heures modifiées", "La saisie a été mise à jour.")
    }
  }

  const handleRemoveEntry = (entryId: string) => {
    if (selectedWeek) {
      removeTimeEntry(selectedWeek.id, entryId)
      notifyDeleted("Activité supprimée", "La ligne a été retirée de la journée.")
    }
  }

  const getProjectById = (id: string) => projects.find((p) => p.id === id)

  const handleCalendarAdd = useCallback((weekNumber?: number, date?: Date) => {
    const targetWeek = weekNumber
      ? weeks.find((w) => w.weekNumber === weekNumber)
      : weeks.find((w) => w.isCurrent)
    if (!targetWeek) return
    setSelectedWeek(targetWeek)
    if (date) {
      const dayMap: Record<number, DayOfWeek> = { 1: "lun", 2: "mar", 3: "mer", 4: "jeu", 5: "ven" }
      const targetDay = dayMap[date.getDay()]
      if (targetDay) {
        setSelectedDay(targetDay)
        setIsDayPanelOpen(true)
      }
    }
  }, [weeks])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault()
        handleCalendarAdd()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [weeks, handleCalendarAdd])

  // ── Helpers heures ──────────────────────────────────────────────────────────

  /** Heures déjà utilisées sur la semaine sélectionnée (sauf l'entrée courante) */
  const getOtherHours = (excludeEntryId: string) =>
    (selectedWeek?.entries ?? [])
      .filter((e) => e.id !== excludeEntryId)
      .reduce((sum, e) => sum + e.hours, 0)

  /** Heures totales saisies sur la semaine */
  const totalHoursUsed = (selectedWeek?.entries ?? []).reduce((s, e) => s + e.hours, 0)
  const weekTargetHours = selectedWeek
    ? resolveDisplayTargetHours(
        selectedWeek,
        frenchHolidays.maps.get(selectedWeek.isoWeekYear ?? DEMO_ISO_WEEK_YEAR),
      )
    : 35
  const remainingHours = Math.max(0, weekTargetHours - totalHoursUsed)

  const selectedWeekWorkdaySlots = useMemo(
    () =>
      selectedWeek
        ? getIsoWeekWorkdaySlots(selectedWeek.isoWeekYear ?? DEMO_ISO_WEEK_YEAR, selectedWeek.weekNumber)
        : [],
    [selectedWeek],
  )

  const visibleDaySlots = useMemo(() => {
    const q = searchQuery.trim()
    if (!selectedWeek || !q) return selectedWeekWorkdaySlots
    const isoY = selectedWeek.isoWeekYear ?? DEMO_ISO_WEEK_YEAR
    const weekAbsences = absences.filter(
      (a) => a.weekId === selectedWeek.id && a.status === "approuvee" && a.dayOfWeek,
    )
    return selectedWeekWorkdaySlots.filter(({ day, date, dateKey }) => {
      const dayEntries = selectedWeek.entries.filter((e) => e.dayOfWeek === day)
      const dayAbsence = weekAbsences.find((a) => a.dayOfWeek === day)
      const ferie = frenchHolidays.getHolidayName(dateKey, isoY)
      return daySlotMatchesSearch(q, day, date, dateKey, dayEntries, projects, dayAbsence, ferie)
    })
  }, [selectedWeek, selectedWeekWorkdaySlots, searchQuery, absences, frenchHolidays, projects])

  const selectedDayCivilDate = useMemo(
    () => selectedWeekWorkdaySlots.find((s) => s.day === selectedDay)?.date,
    [selectedWeekWorkdaySlots, selectedDay],
  )

  const selectedWeekRangeFr = useMemo(
    () =>
      selectedWeek
        ? formatIsoWeekRangeDisplayFr(selectedWeek.isoWeekYear ?? DEMO_ISO_WEEK_YEAR, selectedWeek.weekNumber)
        : null,
    [selectedWeek],
  )

  // ── Filtres ──────────────────────────────────────────────────────────────────

  const hasActiveFilters =
    filterWeek !== "all" ||
    filterProject !== "all" ||
    filterHasAbsence !== "all" ||
    filterListMonth !== "all"
  const activeFilterCount = [
    filterWeek !== "all",
    filterProject !== "all",
    filterHasAbsence !== "all",
    filterListMonth !== "all",
  ].filter(Boolean).length

  const clearFilters = () => {
    setFilterWeek("all")
    setFilterProject("all")
    setFilterHasAbsence("all")
    setFilterListMonth("all")
  }

  const formatListMonthLabel = (key: string) => {
    const d = parse(`${key}-01`, "yyyy-MM-dd", new Date())
    const raw = format(d, "MMMM yyyy", { locale: fr })
    return raw.charAt(0).toUpperCase() + raw.slice(1)
  }

  return (
    <div className="space-y-4">
      {/* Onglets à gauche, recherche + filtres à droite (comme avant) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          value={pointageView}
          onValueChange={(value) => setPointageView(value as "liste" | "calendrier")}
        >
          <TabsList>
            <TabsTrigger value="liste" className="gap-2">
              <List className="h-4 w-4" />
              Liste
            </TabsTrigger>
            <TabsTrigger value="calendrier" className="gap-2">
              <Calendar className="h-4 w-4" />
              Calendrier
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:flex-none sm:flex-initial">
          <div className="relative w-full min-w-[10rem] max-w-md sm:w-56">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Jour, date, semaine, projet…"
              className="h-9 w-full pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Recherche globale pointage"
            />
          </div>
          <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={`h-9 shrink-0 gap-2 ${hasActiveFilters ? "border-primary/50 bg-primary/5 text-primary" : ""}`}
              >
                <Filter className="h-4 w-4" />
                Filtres
                {hasActiveFilters && (
                  <Badge
                    variant="secondary"
                    className="ml-1 flex size-5 shrink-0 items-center justify-center rounded-full p-0 text-xs tabular-nums"
                  >
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 border border-border/50 p-0 shadow-lg" align="end">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-muted/50">
                  <span className="text-sm font-semibold text-foreground">Filtres</span>
                  {hasActiveFilters && (
                    <button 
                      onClick={clearFilters} 
                      className="text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                      Effacer tout
                    </button>
                  )}
                </div>
                
                {/* Filter Options */}
                <div className="p-4 space-y-4">
                  {/* Mois civil (liste des semaines) */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Mois (semaines)
                    </label>
                    <Select value={filterListMonth} onValueChange={setFilterListMonth}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Tous les mois" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les mois</SelectItem>
                        {listMonthOptions.map((key) => (
                          <SelectItem key={key} value={key}>
                            {formatListMonthLabel(key)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-muted-foreground leading-snug">
                      Affiche uniquement les semaines qui ont au moins un lundi–vendredi dans ce mois.
                    </p>
                  </div>

                  {/* Period Filter */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Periode</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { value: "all", label: "Toutes" },
                        { value: "current", label: "Courante" },
                        { value: "past", label: "Passees" },
                        { value: "future", label: "A venir" },
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setFilterWeek(option.value)}
                          className={`px-3 py-2 text-xs font-medium rounded-md border transition-all ${
                            filterWeek === option.value
                              ? 'border-primary text-primary bg-background'
                              : 'border-transparent bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Project Filter */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Projet</label>
                    <Select value={filterProject} onValueChange={setFilterProject}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Tous les projets" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les projets</SelectItem>
                        {projects.map(p => (
                          <SelectItem key={p.id} value={p.id}>
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                              <span>{p.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Absence Filter */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Absences</label>
                    <div className="flex gap-1.5">
                      {[
                        { value: "all", label: "Toutes" },
                        { value: "with", label: "Avec" },
                        { value: "without", label: "Sans" },
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setFilterHasAbsence(option.value)}
                          className={`flex-1 px-3 py-2 text-xs font-medium rounded-md border transition-all ${
                            filterHasAbsence === option.value
                              ? 'border-primary text-primary bg-background'
                              : 'border-transparent bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Footer */}
                <div className="px-4 py-3 border-t border-border bg-muted/30">
                  <Button className="w-full h-9" size="sm" onClick={() => setIsFilterOpen(false)}>
                    Appliquer les filtres
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
        </div>
      </div>

      {/* Pastilles filtres structuraux + recherche textuelle */}
      {(hasActiveFilters || searchQuery.trim()) && (
        <div className="flex flex-wrap items-center gap-2">
          {searchQuery.trim() && (
            <Badge variant="outline" className="max-w-full gap-1 pr-1 font-normal">
              <span className="truncate">Recherche : {searchQuery}</span>
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="ml-1 shrink-0 rounded-full p-0.5 hover:bg-muted"
                aria-label="Effacer la recherche"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filterWeek !== "all" && (
            <Badge variant="secondary" className="gap-1 pr-1">
              {filterWeek === "current" ? "Semaine courante" : filterWeek === "past" ? "Passees" : "A venir"}
              <button onClick={() => setFilterWeek("all")} className="ml-1 hover:bg-muted rounded-full p-0.5">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {filterProject !== "all" && (
            <Badge variant="secondary" className="gap-1 pr-1">
              {projects.find(p => p.id === filterProject)?.name}
              <button onClick={() => setFilterProject("all")} className="ml-1 hover:bg-muted rounded-full p-0.5">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {filterHasAbsence !== "all" && (
            <Badge variant="secondary" className="gap-1 pr-1">
              {filterHasAbsence === "with" ? "Avec absences" : "Sans absences"}
              <button onClick={() => setFilterHasAbsence("all")} className="ml-1 hover:bg-muted rounded-full p-0.5">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {filterListMonth !== "all" && (
            <Badge variant="secondary" className="gap-1 pr-1">
              {formatListMonthLabel(filterListMonth)}
              <button onClick={() => setFilterListMonth("all")} className="ml-1 hover:bg-muted rounded-full p-0.5">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
        </div>
      )}

      {pointageView === "liste" ? (
        <>
          {/* ── VUE JOURS (semaine sélectionnée) ────────────────────────────── */}
          {selectedWeek ? (
            <div className="border border-border rounded-lg overflow-hidden">
              {/* Header de la semaine */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 py-3 border-b border-border bg-muted/30">
                <div className="flex items-center gap-2 min-w-0 flex-1 flex-wrap">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={handleBackToWeeks}
                    aria-label="Retour à la liste des semaines"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div className="min-w-0 w-[min(100%,18rem)] sm:w-auto sm:max-w-md">
                    <WeekSelectorPopover
                      weeks={weeksMatchingStructuralFilters}
                      selectedWeek={selectedWeek}
                      currentWeekNumber={currentWeekNumber}
                      onSelect={setSelectedWeek}
                    />
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {selectedWeek.isCurrent && (
                      <Badge className="border-0 bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-950/50 dark:text-blue-200 text-xs font-normal">
                        En cours
                      </Badge>
                    )}
                    {isPastWeek(selectedWeek.weekNumber) && !selectedWeek.isCurrent && (
                      <Badge variant="outline" className="text-xs font-normal text-muted-foreground border-border">
                        <span className="flex items-center gap-1">
                          <History className="w-3 h-3" />
                          Semaine passée
                        </span>
                      </Badge>
                    )}
                    {!isPastWeek(selectedWeek.weekNumber) && !selectedWeek.isCurrent && (
                      <Badge variant="outline" className="text-xs font-normal border-sky-400/50 text-sky-800 dark:text-sky-300">
                        À venir
                      </Badge>
                    )}
                  </div>
                </div>
                {/* Progress semaine */}
                {(() => {
                  const absH = absences.filter(a => a.weekId === selectedWeek.id && a.status === "approuvee" && a.dayOfWeek).length * 7
                  const effectiveTotal = totalHoursUsed + absH
                  return (
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">{effectiveTotal}h <span className="text-xs font-normal text-muted-foreground">/ {weekTargetHours}h</span></p>
                    <Progress
                      value={(effectiveTotal / Math.max(weekTargetHours, 1)) * 100}
                      className={`h-1.5 w-28 bg-muted ${effectiveTotal >= weekTargetHours ? "[&>div]:bg-green-500" : "[&>div]:bg-blue-500"}`}
                    />
                  </div>
                  <WeekHoursStatusBadge status={selectedWeek.status} />
                </div>
                  )
                })()}
              </div>

              {/* Lignes jours */}
              {(() => {
                const weekAbsences = absences.filter(a =>
                  a.weekId === selectedWeek.id && a.status === "approuvee" && a.dayOfWeek
                )
                const isoY = selectedWeek.isoWeekYear ?? DEMO_ISO_WEEK_YEAR

                const dayLabel = (day: DayOfWeek, date: Date) => (
                  <span className="flex min-w-0 flex-wrap items-baseline gap-x-1.5">
                    <span className="text-sm font-medium text-foreground">{DAY_LABELS[day]}</span>
                    <span className="text-[11px] font-normal tabular-nums text-muted-foreground">
                      {format(date, "d MMM.", { locale: fr })}
                    </span>
                  </span>
                )

                const absenceTypeColor: Record<string, string> = {
                  conges_payes: "bg-violet-100 text-violet-700 border-violet-300 dark:bg-violet-900/40 dark:text-violet-300",
                  maladie:      "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/40 dark:text-red-300",
                  teletravail:  "bg-sky-100 text-sky-700 border-sky-300 dark:bg-sky-900/40 dark:text-sky-300",
                  sans_solde:   "bg-muted text-muted-foreground border-border",
                }

                return (
                  <div className="divide-y divide-border">
                    {visibleDaySlots.length === 0 && searchQuery.trim() ? (
                      <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                        Aucun jour ouvré ne correspond à « {searchQuery} » dans cette semaine.
                      </div>
                    ) : null}
                    {visibleDaySlots.map(({ day, date, dateKey }) => {
                      const dayEntries = selectedWeek.entries.filter(e => e.dayOfWeek === day)
                      const dayHours = dayEntries.reduce((s, e) => s + e.hours, 0)
                      const dayAbsence = weekAbsences.find(a => a.dayOfWeek === day)
                      const ferie = frenchHolidays.getHolidayName(dateKey, isoY)
                      const effectiveH = dayAbsence ? 7 : dayHours
                      const uniqueIds = [...new Set(dayEntries.map(e => e.projectId))]

                      if (dayAbsence) {
                        return (
                          <div
                            key={dateKey}
                            className="grid grid-cols-[1fr_auto_90px_32px] items-center px-4 py-3 bg-muted/20 opacity-80 transition-colors hover:bg-muted/30 dark:hover:bg-muted/15"
                          >
                            <div>{dayLabel(day, date)}</div>
                            <div className="pr-4">
                              <Badge variant="outline" className={`text-xs font-normal ${absenceTypeColor[dayAbsence.type] || ""}`}>
                                {dayAbsence.typeLabel}
                              </Badge>
                            </div>
                            <div className="text-center">
                              <span className="text-sm font-semibold text-muted-foreground">{HOURS_PER_WORKDAY}h</span>
                              <span className="text-xs text-muted-foreground"> / {HOURS_PER_WORKDAY}h</span>
                            </div>
                            <div className="w-4 mx-auto" />
                          </div>
                        )
                      }

                      if (ferie) {
                        return (
                          <div
                            key={dateKey}
                            className="grid grid-cols-[1fr_auto_90px_32px] items-center px-4 py-3 cursor-default bg-muted/25 dark:bg-muted/10"
                            title={ferie}
                          >
                            <div>{dayLabel(day, date)}</div>
                            <div className="pr-4">
                              <Badge
                                variant="outline"
                                className="text-xs font-normal border-slate-400/50 text-slate-700 dark:border-slate-500/50 dark:text-slate-300"
                              >
                                Férié · {ferie}
                              </Badge>
                            </div>
                            <div className="text-center">
                              <span className="text-sm font-semibold text-muted-foreground">—</span>
                              <span className="text-xs text-muted-foreground"> / {HOURS_PER_WORKDAY}h</span>
                            </div>
                            <div className="w-4 mx-auto" />
                          </div>
                        )
                      }

                      return (
                        <ContextMenu key={dateKey}>
                          <ContextMenuTrigger asChild>
                        <div
                          className="grid grid-cols-[1fr_auto_90px_32px] items-center px-4 py-3 cursor-pointer transition-colors hover:bg-muted/40 dark:hover:bg-muted/15 group"
                          onClick={() => handleDayClick(day)}
                        >
                          <div>{dayLabel(day, date)}</div>

                          <div className="flex items-center gap-1.5 pr-4 flex-wrap">
                            {uniqueIds.length > 0 ? (
                              uniqueIds.slice(0, 3).map(pid => {
                                const p = getProjectById(pid)
                                return (
                                  <span key={pid} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border border-border bg-background text-foreground/70">
                                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: p?.color || "#888" }} />
                                    {p?.name || "—"}
                                  </span>
                                )
                              })
                            ) : (
                              <span className="text-xs text-muted-foreground/40">—</span>
                            )}
                            {uniqueIds.length > 3 && <span className="text-xs text-muted-foreground">+{uniqueIds.length - 3}</span>}
                          </div>

                          <div className="text-center">
                            <span className={`text-sm font-semibold ${timesheetDayHoursTextClass(effectiveH)}`}>
                              {formatHoursLabel(effectiveH)}
                            </span>
                            <span className="text-xs text-muted-foreground"> / {HOURS_PER_WORKDAY}h</span>
                          </div>

                          <ChevronRight className="w-4 h-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 mx-auto" />
                        </div>
                          </ContextMenuTrigger>
                          <ContextMenuContent className="w-52">
                            <ContextMenuItem onSelect={() => handleDayClick(day)}>
                              Ouvrir ce jour
                            </ContextMenuItem>
                          </ContextMenuContent>
                        </ContextMenu>
                      )
                    })}
                  </div>
                )
              })()}
            </div>
          ) : (
            /* ── VUE SEMAINES (liste) ─────────────────────────────────────── */
            <div className="border border-border rounded-lg overflow-hidden">

              <div className="divide-y divide-border">
                {filteredWeeks.map((week) => {
                  const isPast = isPastWeek(week.weekNumber)
                  const stats  = getWeekStats(week)
                  const isoY = week.isoWeekYear ?? DEMO_ISO_WEEK_YEAR
                  const weekRangeFr = formatIsoWeekRangeDisplayFr(isoY, week.weekNumber)
                  const displayTarget = resolveDisplayTargetHours(
                    week,
                    frenchHolidays.maps.get(isoY),
                  )

                  const weekCardStats: { label: string; value: string; subtle?: boolean }[] = [
                    ...week.entries.reduce<{ label: string; value: string }[]>((acc, entry) => {
                      const p = projects.find(proj => proj.id === entry.projectId)
                      const existing = acc.find(a => a.label === (p?.name || "Projet"))
                      if (existing) {
                        existing.value = formatHoursLabel(parseFloat(existing.value) + entry.hours)
                      } else {
                        acc.push({ label: p?.name || "Projet", value: formatHoursLabel(entry.hours) })
                      }
                      return acc
                    }, []),
                    ...(week.absenceCount > 0 ? [{ label: "Absences", value: `${week.absenceCount}j`, subtle: true }] : []),
                  ]

                  const isPastIncomplete = isPast && week.status !== "complet"

                  return (
                    <ContextMenu key={week.id}>
                      <ContextMenuTrigger asChild>
                    <div
                      className={cn(
                        "grid grid-cols-[1fr_88px_32px] items-center cursor-pointer transition-colors group",
                        uiDensity.listRowCompact,
                        week.isCurrent &&
                          "bg-blue-50 dark:bg-blue-950/30 border-l-2 border-l-blue-500 hover:bg-blue-100/65 dark:hover:bg-blue-950/45",
                        !week.isCurrent &&
                          isPastIncomplete &&
                          "border-l-2 border-l-red-400 opacity-40 hover:opacity-100 hover:bg-muted/40 dark:hover:bg-muted/15",
                        !week.isCurrent &&
                          isPast &&
                          !isPastIncomplete &&
                          "opacity-40 hover:opacity-100 hover:bg-muted/40 dark:hover:bg-muted/15",
                        !week.isCurrent && !isPast && "hover:bg-muted/40 dark:hover:bg-muted/15",
                      )}
                      onClick={() => handleWeekClick(week)}
                    >
                      {/* Identité semaine */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={uiDensity.sectionTitle}>Semaine {week.weekNumber}</span>
                          {week.isCurrent && (
                            <Badge variant="outline" className="border-blue-400/60 text-blue-800 dark:border-blue-500/50 dark:text-blue-300 text-xs font-normal">
                              En cours
                            </Badge>
                          )}
                          {isPastIncomplete && (
                            <Badge variant="outline" className="border-red-400/50 text-red-600 dark:text-red-400 text-xs font-normal">
                              À compléter
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{weekRangeFr.startDate} – {weekRangeFr.endDate}</p>

                        {/* Badges activités + absences avec hover */}
                        <HoverCard openDelay={150} closeDelay={100}>
                          <HoverCardTrigger asChild>
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              <Badge variant="outline" className={`text-xs font-normal ${stats.projectCount > 0 ? "border-primary/50 text-primary" : "border-border text-muted-foreground"}`}>
                                {stats.projectCount} activité{stats.projectCount > 1 ? "s" : ""}
                              </Badge>
                              {stats.absenceCount > 0 && (
                                <Badge variant="outline" className="text-xs font-normal border-red-400/80 text-red-700 dark:border-red-600/70 dark:text-red-400">
                                  {stats.absenceCount} absence{stats.absenceCount > 1 ? "s" : ""}
                                </Badge>
                              )}
                            </div>
                          </HoverCardTrigger>
                          <HoverCardContent className="w-64 p-0 shadow-xl border border-border/50 overflow-hidden" side="right" align="start">
                            <div className="px-4 py-3 bg-gradient-to-r from-muted/80 to-muted/40 border-b border-border/50">
                              <p className="font-semibold text-sm text-foreground">Semaine {week.weekNumber}</p>
                              <span className="text-xs text-muted-foreground mt-1 block">
                                {weekRangeFr.startDate} – {weekRangeFr.endDate}
                              </span>
                            </div>
                            <div className="p-4 space-y-3">
                              {weekCardStats.map((stat, idx) =>
                                stat.subtle ? (
                                  <div key={idx} className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">{stat.label}</span>
                                    <span className="text-xs text-muted-foreground">{stat.value}</span>
                                  </div>
                                ) : (
                                  <div key={idx} className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">{stat.label}</span>
                                    <span className="text-sm font-semibold text-foreground">{stat.value}</span>
                                  </div>
                                ),
                              )}
                            </div>
                          </HoverCardContent>
                        </HoverCard>
                      </div>

                      {/* Heures + statut empilés */}
                      <div className="flex flex-col items-end gap-1.5">
                        <span className="text-xs font-semibold text-foreground tabular-nums">
                          {week.totalHours}h<span className="text-[11px] font-normal text-muted-foreground">/{displayTarget}h</span>
                        </span>
                        <WeekHoursStatusBadge status={week.status} />
                      </div>

                      {/* Chevron */}
                      <ChevronRight className="w-4 h-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 mx-auto" />
                    </div>
                      </ContextMenuTrigger>
                      <ContextMenuContent className="w-52">
                        <ContextMenuItem onSelect={() => handleWeekClick(week)}>
                          Ouvrir le détail de la semaine
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  )
                })}
                {filteredWeeks.length === 0 && (
                  <div className="py-10 text-center text-sm text-muted-foreground">
                    Aucune semaine ne correspond aux filtres
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        <TimesheetCalendar
          weeks={weeksMatchingStructuralFilters}
          onWeekSelect={(week) => {
            handleWeekClick(week)
          }}
          onAddClick={handleCalendarAdd}
          onDateClick={(date, weekNumber) => handleCalendarAdd(weekNumber, date)}
          holidayLookup={{
            getHolidayName: frenchHolidays.getHolidayName,
            loading: frenchHolidays.loading,
            error: frenchHolidays.error,
          }}
        />
      )}

      {/* ── PANEL JOUR (Sheet latéral) ──────────────────────────────────────────── */}
      <AppSidePanel
        open={isDayPanelOpen}
        onOpenChange={(open) => {
          setIsDayPanelOpen(open)
          if (!open) setSelectedDay(null)
        }}
        panelKind={AppPanelKind.TimesheetDayEdit}
        width="narrow"
        banner={
          selectedWeek && isPastWeek(selectedWeek.weekNumber) ? (
            <div className="flex shrink-0 items-center gap-2 border-b border-border bg-muted/60 px-4 py-2.5 text-[11px] text-muted-foreground">
              <History className="h-3.5 w-3.5 shrink-0" />
              <span>{AppLabel.timesheet.pastWeekBanner}</span>
            </div>
          ) : undefined
        }
        title={
          selectedDay ? (
            <span className="flex flex-col gap-0.5 sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-x-1.5">
              <span>{DAY_LABELS[selectedDay]}</span>
              {selectedDayCivilDate ? (
                <span className="text-[11px] font-normal text-muted-foreground">
                  · {format(selectedDayCivilDate, "d MMMM yyyy", { locale: fr })}
                </span>
              ) : null}
            </span>
          ) : (
            "—"
          )
        }
        description={
          selectedWeek && selectedWeekRangeFr ? (
            <>
              Semaine ISO {selectedWeek.weekNumber} · {selectedWeekRangeFr.startDate} – {selectedWeekRangeFr.endDate}
            </>
          ) : (
            "—"
          )
        }
        footer={
          <Button
            className="h-9 w-full text-xs"
            size="sm"
            onClick={() => {
              notifySaved(AppLabel.timesheet.saveDayToastTitle, AppLabel.timesheet.saveDayToastDesc)
              setIsDayPanelOpen(false)
            }}
          >
            {AppLabel.common.save}
          </Button>
        }
      >
        <div className={cn(appSidePanelTokens.summaryBox, "mb-4")}>
          <div className={appSidePanelTokens.summaryHeaderRow}>
            <span className={appSidePanelTokens.summaryLabel}>{AppLabel.timesheet.dayPanelWeekProgress}</span>
            <span className={cn(appSidePanelTokens.summaryValue, "text-xs")}>
              {formatHoursLabel(totalHoursUsed)} / {weekTargetHours}h
              {remainingHours > 0 && (
                <span className="font-normal text-muted-foreground"> · {formatHoursLabel(remainingHours)} dispo</span>
              )}
            </span>
          </div>
          <Progress
            value={(totalHoursUsed / Math.max(weekTargetHours, 1)) * 100}
            className={`h-1.5 bg-muted ${totalHoursUsed >= weekTargetHours ? "[&>div]:bg-green-500" : "[&>div]:bg-blue-500"}`}
          />
        </div>

        <div className="space-y-3">
          {(() => {
            const dayEntries = selectedDay
              ? (selectedWeek?.entries.filter((e) => e.dayOfWeek === selectedDay) || [])
              : []
            const dayHours = dayEntries.reduce((s, e) => s + e.hours, 0)
            const canAdd =
              remainingHours > 0 &&
              dayHours < HOURS_PER_WORKDAY &&
              projects.filter((p) => !dayEntries.map((e) => e.projectId).includes(p.id)).length > 0

            return (
              <>
                {dayEntries.length === 0 && (
                  <p className="py-4 text-center text-xs text-muted-foreground">{AppLabel.timesheet.noActivityDay}</p>
                )}
                {dayEntries.map((entry) => {
                  const project = getProjectById(entry.projectId)
                  const otherHours = getOtherHours(entry.id)
                  const maxDay = Math.min(HOURS_PER_WORKDAY - (dayHours - entry.hours), weekTargetHours - otherHours)

                  return (
                    <div
                      key={entry.id}
                      className="flex items-center gap-2 rounded-lg border border-border bg-background p-2"
                    >
                      <div
                        className="h-2.5 w-2.5 flex-shrink-0 rounded-sm"
                        style={{ backgroundColor: project?.color || "#888" }}
                      />
                      <div className="min-w-0 max-w-[10.5rem] shrink-0 sm:max-w-[12.5rem]">
                        <Select
                          value={entry.projectId}
                          onValueChange={(projectId) => {
                            if (!selectedWeek || projectId === entry.projectId) return
                            const otherIds = dayEntries
                              .filter((e) => e.id !== entry.id)
                              .map((e) => e.projectId)
                            if (otherIds.includes(projectId)) return
                            updateTimeEntryProject(selectedWeek.id, entry.id, projectId)
                            const name = projects.find((p) => p.id === projectId)?.name ?? "Projet"
                            notifyUpdated("Projet modifié", `L’activité est rattachée à « ${name} ».`)
                          }}
                        >
                          <SelectTrigger className="h-8 w-full text-xs [&>span]:truncate">
                            <SelectValue placeholder="—" />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {projects
                              .filter(
                                (p) =>
                                  p.id === entry.projectId ||
                                  !dayEntries.some((e) => e.id !== entry.id && e.projectId === p.id),
                              )
                              .map((p) => (
                                <SelectItem key={p.id} value={p.id} className="text-xs">
                                  <div className="flex max-w-[14rem] items-center gap-2">
                                    <div className="h-2 w-2 shrink-0 rounded-sm" style={{ backgroundColor: p.color }} />
                                    <span className="truncate">{p.name}</span>
                                  </div>
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="ml-auto flex shrink-0 items-center gap-1.5">
                        <HoursInput
                          value={entry.hours}
                          max={Math.max(0, maxDay)}
                          onChange={(h) => handleHoursChange(entry.id, h)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() => handleRemoveEntry(entry.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  )
                })}

                <button
                  type="button"
                  onClick={handleAddActivity}
                  disabled={!canAdd}
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-30"
                >
                  <Plus className="h-4 w-4" />
                  {AppLabel.timesheet.addActivity}
                </button>

                {dayEntries.length > 0 && (
                  <div className={appSidePanelTokens.summaryFooterRow}>
                    <span className={appSidePanelTokens.summaryLabel}>{AppLabel.timesheet.dayPanelTotalDay}</span>
                    <span
                      className={cn(
                        "text-sm font-semibold tabular-nums",
                        timesheetDayHoursTextClass(dayHours),
                      )}
                    >
                      {formatHoursLabel(dayHours)} / {HOURS_PER_WORKDAY}h
                    </span>
                  </div>
                )}
              </>
            )
          })()}
        </div>

        <Separator className="my-4" />
      </AppSidePanel>
    </div>
  )
}
