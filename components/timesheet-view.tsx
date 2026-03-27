"use client"

import { useState, useEffect } from "react"
import { useTimesheet, WeekData } from "@/contexts/timesheet-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar, List, ChevronRight, ChevronLeft, Trash2, Search, Filter, X, History, Plus } from "lucide-react"
import { TimesheetCalendar } from "./timesheet-calendar"
import { InfoCardPopover } from "@/components/info-card-popover"
import type { DayOfWeek } from "@/contexts/timesheet-context"

// ── Constantes jours ──────────────────────────────────────────────────────────
const DAYS: DayOfWeek[] = ["lun", "mar", "mer", "jeu", "ven"]
const DAY_LABELS: Record<DayOfWeek, string> = {
  lun: "Lundi", mar: "Mardi", mer: "Mercredi", jeu: "Jeudi", ven: "Vendredi",
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
  const { weeks, projects, absences, pointageView, setPointageView, addTimeEntry, updateTimeEntry, removeTimeEntry } = useTimesheet()
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

  // Sort weeks: current first, then future, then past
  const currentWeekNumber = weeks.find(w => w.isCurrent)?.weekNumber || 41
  const isPastWeek = (weekNumber: number) => weekNumber < currentWeekNumber

  // Filter weeks
  const filteredWeeks = [...weeks]
    .filter(week => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesWeek = `semaine ${week.weekNumber}`.toLowerCase().includes(query) ||
          `week ${week.weekNumber}`.toLowerCase().includes(query) ||
          week.weekNumber.toString().includes(query)
        const matchesProject = week.entries.some(e => {
          const project = projects.find(p => p.id === e.projectId)
          return project?.name.toLowerCase().includes(query)
        })
        if (!matchesWeek && !matchesProject) return false
      }
      
      if (filterWeek !== "all") {
        if (filterWeek === "current" && !week.isCurrent) return false
        if (filterWeek === "past" && !isPastWeek(week.weekNumber)) return false
        if (filterWeek === "future" && (isPastWeek(week.weekNumber) || week.isCurrent)) return false
      }
      
      if (filterProject !== "all") {
        if (!week.entries.some(e => e.projectId === filterProject)) return false
      }
      
      if (filterHasAbsence !== "all") {
        if (filterHasAbsence === "with" && week.absenceCount === 0) return false
        if (filterHasAbsence === "without" && week.absenceCount > 0) return false
      }
      
      return true
    })
    .sort((a, b) => {
      if (a.isCurrent) return -1
      if (b.isCurrent) return 1
      return b.weekNumber - a.weekNumber
    })

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

  // Keyboard shortcut Ctrl+N
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault()
        handleCalendarAdd()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [weeks])

  useEffect(() => {
    if (initialWeekId) {
      const week = weeks.find(w => w.id === initialWeekId)
      if (week) setSelectedWeek(week)
    }
  }, [initialWeekId, weeks])

  useEffect(() => {
    if (selectedWeek) {
      const updatedWeek = weeks.find(w => w.id === selectedWeek.id)
      if (updatedWeek) {
        setSelectedWeek(updatedWeek)
      }
    }
  }, [weeks, selectedWeek?.id])

  // Clic semaine → vue jours (pas de panel)
  const handleWeekClick = (week: WeekData) => {
    setSelectedWeek(week)
  }

  // Retour à la liste des semaines
  const handleBackToWeeks = () => {
    setSelectedWeek(null)
    if (onPanelClose) onPanelClose()
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
    if (dayHours >= 7) return
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
      const otherHours = selectedWeek.entries
        .filter((e) => e.id !== entryId)
        .reduce((sum, e) => sum + e.hours, 0)
      const capped = Math.min(hours, 35 - otherHours)
      updateTimeEntry(selectedWeek.id, entryId, capped)
    }
  }

  const handleRemoveEntry = (entryId: string) => {
    if (selectedWeek) {
      removeTimeEntry(selectedWeek.id, entryId)
    }
  }

  const getProjectById = (id: string) => projects.find((p) => p.id === id)

  const handleCalendarAdd = (weekNumber?: number, date?: Date) => {
    const targetWeek = weekNumber
      ? weeks.find(w => w.weekNumber === weekNumber)
      : weeks.find(w => w.isCurrent)
    if (!targetWeek) return
    // Passer en vue liste pour afficher la vue jours
    setPointageView("liste")
    setSelectedWeek(targetWeek)
    // Si une date précise est fournie, ouvrir directement le panel du jour
    if (date) {
      const dayMap: Record<number, DayOfWeek> = { 1: "lun", 2: "mar", 3: "mer", 4: "jeu", 5: "ven" }
      const targetDay = dayMap[date.getDay()]
      if (targetDay) {
        setSelectedDay(targetDay)
        setIsDayPanelOpen(true)
      }
    }
  }

  // ── Helpers heures ──────────────────────────────────────────────────────────

  const TARGET_HOURS = 35

  /** Formate un nombre d'heures en "1h", "1h30", "0h30" */
  const formatHoursLabel = (h: number) => {
    if (h === 0) return "0h"
    const full = Math.floor(h)
    const hasHalf = h % 1 !== 0
    return hasHalf ? `${full}h30` : `${full}h`
  }

  /** Heures déjà utilisées sur la semaine sélectionnée (sauf l'entrée courante) */
  const getOtherHours = (excludeEntryId: string) =>
    (selectedWeek?.entries ?? [])
      .filter((e) => e.id !== excludeEntryId)
      .reduce((sum, e) => sum + e.hours, 0)

  /** Heures totales saisies sur la semaine */
  const totalHoursUsed = (selectedWeek?.entries ?? []).reduce((s, e) => s + e.hours, 0)
  const remainingHours = Math.max(0, TARGET_HOURS - totalHoursUsed)

  // ── Filtres ──────────────────────────────────────────────────────────────────

  const hasActiveFilters = filterWeek !== "all" || filterProject !== "all" || filterHasAbsence !== "all"
  const activeFilterCount = [filterWeek !== "all", filterProject !== "all", filterHasAbsence !== "all"].filter(Boolean).length

  const clearFilters = () => {
    setFilterWeek("all")
    setFilterProject("all")
    setFilterHasAbsence("all")
  }

  return (
    <div className="space-y-4">
      {/* Header with toggle and actions */}
      <div className="flex items-center justify-between">
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

        {pointageView === "liste" && (
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Rechercher..." 
                className="pl-9 w-48 h-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {/* Styled Filter Popover */}
            <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className={`h-9 gap-2 transition-all ${hasActiveFilters ? 'border-primary/50 bg-primary/5 text-primary' : ''}`}
                >
                  <Filter className="w-4 h-4" />
                  Filtres
                  {hasActiveFilters && (
                    <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-0 shadow-lg border border-border/50" align="end">
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
                  <Button 
                    className="w-full h-9" 
                    size="sm" 
                    onClick={() => setIsFilterOpen(false)}
                  >
                    Appliquer les filtres
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && pointageView === "liste" && (
        <div className="flex items-center gap-2 flex-wrap">
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
        </div>
      )}

      {pointageView === "liste" ? (
        <>
          {/* ── VUE JOURS (semaine sélectionnée) ────────────────────────────── */}
          {selectedWeek ? (
            <div className="border border-border rounded-lg overflow-hidden">
              {/* Header de la semaine */}
              <div className={`flex items-center justify-between px-4 py-3 border-b border-border ${selectedWeek.isCurrent ? "bg-blue-50 dark:bg-blue-950/30" : "bg-muted/40"}`}>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleBackToWeeks}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <Separator orientation="vertical" className="h-4" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">Semaine {selectedWeek.weekNumber}</span>
                      {selectedWeek.isCurrent && (
                        <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 hover:bg-amber-100 text-xs font-normal">
                          En cours
                        </Badge>
                      )}
                      {isPastWeek(selectedWeek.weekNumber) && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <History className="w-3 h-3" />
                          <span>Passée</span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{selectedWeek.startDate} – {selectedWeek.endDate}</p>
                  </div>
                </div>
                {/* Progress semaine */}
                {(() => {
                  const absH = absences.filter(a => a.weekId === selectedWeek.id && a.status === "approuvee" && a.dayOfWeek).length * 7
                  const effectiveTotal = totalHoursUsed + absH
                  return (
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">{effectiveTotal}h <span className="text-xs font-normal text-muted-foreground">/ {TARGET_HOURS}h</span></p>
                    <Progress
                      value={(effectiveTotal / TARGET_HOURS) * 100}
                      className={`h-1.5 w-28 bg-muted ${effectiveTotal >= TARGET_HOURS ? "[&>div]:bg-green-500" : "[&>div]:bg-blue-500"}`}
                    />
                  </div>
                  <Badge variant="outline" className={`text-xs font-normal ${
                    selectedWeek.status === "complet"
                      ? "border-green-500/50 text-green-700 dark:text-green-400"
                      : "border-red-400/50 text-red-600 dark:text-red-400"
                  }`}>
                    {selectedWeek.status}
                  </Badge>
                </div>
                  )
                })()}
              </div>

              {/* Lignes jours */}
              {(() => {
                const weekAbsences = absences.filter(a =>
                  a.weekId === selectedWeek.id && a.status === "approuvee" && a.dayOfWeek
                )
                return (
                  <div className="divide-y divide-border">
                    {DAYS.map((day) => {
                      const dayEntries   = selectedWeek.entries.filter(e => e.dayOfWeek === day)
                      const dayHours     = dayEntries.reduce((s, e) => s + e.hours, 0)
                      const dayAbsence   = weekAbsences.find(a => a.dayOfWeek === day)
                      const effectiveH   = dayAbsence ? 7 : dayHours
                      const uniqueIds    = [...new Set(dayEntries.map(e => e.projectId))]

                      const absenceTypeColor: Record<string, string> = {
                        conges_payes: "bg-violet-100 text-violet-700 border-violet-300 dark:bg-violet-900/40 dark:text-violet-300",
                        maladie:      "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/40 dark:text-red-300",
                        teletravail:  "bg-sky-100 text-sky-700 border-sky-300 dark:bg-sky-900/40 dark:text-sky-300",
                        sans_solde:   "bg-muted text-muted-foreground border-border",
                      }

                      if (dayAbsence) {
                        // Jour avec absence → non cliquable, style distinct
                        return (
                          <div key={day} className="grid grid-cols-[1fr_auto_90px_32px] items-center px-4 py-3 bg-muted/20 opacity-80">
                            <span className="text-sm font-medium text-foreground">{DAY_LABELS[day]}</span>
                            <div className="pr-4">
                              <Badge variant="outline" className={`text-xs font-normal ${absenceTypeColor[dayAbsence.type] || ""}`}>
                                {dayAbsence.typeLabel}
                              </Badge>
                            </div>
                            <div className="text-center">
                              <span className="text-sm font-semibold text-muted-foreground">7h</span>
                              <span className="text-xs text-muted-foreground"> / 7h</span>
                            </div>
                            <div className="w-4 mx-auto" />
                          </div>
                        )
                      }

                      return (
                        <div
                          key={day}
                          className="grid grid-cols-[1fr_auto_90px_32px] items-center px-4 py-3 hover:bg-muted/30 cursor-pointer transition-colors group"
                          onClick={() => handleDayClick(day)}
                        >
                          <span className="text-sm font-medium text-foreground">{DAY_LABELS[day]}</span>

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
                            <span className={`text-sm font-semibold ${effectiveH >= 7 ? "text-green-600 dark:text-green-400" : effectiveH > 0 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground/40"}`}>
                              {formatHoursLabel(effectiveH)}
                            </span>
                            <span className="text-xs text-muted-foreground"> / 7h</span>
                          </div>

                          <ChevronRight className="w-4 h-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 mx-auto" />
                        </div>
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

                  const weekCardStats = [
                    ...week.entries.reduce<{label:string;value:string}[]>((acc, entry) => {
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
                    <div
                      key={week.id}
                      className={`grid grid-cols-[1fr_88px_32px] items-center px-4 py-3 cursor-pointer transition-colors group
                        ${week.isCurrent        ? "bg-blue-50 dark:bg-blue-950/30 border-l-2 border-l-blue-500"
                        : isPastIncomplete      ? "opacity-40 border-l-2 border-l-red-400"
                        : isPast               ? "opacity-40"
                        : ""}
                      `}
                      onClick={() => handleWeekClick(week)}
                    >
                      {/* Identité semaine */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">Semaine {week.weekNumber}</span>
                          {week.isCurrent && (
                            <Badge variant="outline" className="border-amber-400/60 text-amber-700 dark:text-amber-400 text-xs font-normal">
                              En cours
                            </Badge>
                          )}
                          {isPastIncomplete && (
                            <Badge variant="outline" className="border-red-400/50 text-red-600 dark:text-red-400 text-xs font-normal">
                              À compléter
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{week.startDate} – {week.endDate}</p>

                        {/* Badges activités + absences avec hover */}
                        <InfoCardPopover
                          variant="stats"
                          trigger="hover"
                          title={`Semaine ${week.weekNumber}`}
                          subtitle={`${week.startDate} – ${week.endDate}`}
                          theme="default"
                          side="right"
                          align="start"
                          width="w-64"
                          stats={weekCardStats}
                          triggerClassName="flex items-center gap-2 mt-1.5 flex-wrap"
                        >
                          <>
                            <Badge variant="outline" className={`text-xs font-normal ${stats.projectCount > 0 ? "border-primary/50 text-primary" : "border-border text-muted-foreground"}`}>
                              {stats.projectCount} activité{stats.projectCount > 1 ? "s" : ""}
                            </Badge>
                            {stats.absenceCount > 0 && (
                              <Badge variant="outline" className="text-xs font-normal border-orange-300 text-orange-600 dark:border-orange-700 dark:text-orange-400">
                                {stats.absenceCount} absence{stats.absenceCount > 1 ? "s" : ""}
                              </Badge>
                            )}
                          </>
                        </InfoCardPopover>
                      </div>

                      {/* Heures + statut empilés */}
                      <div className="flex flex-col items-end gap-1.5">
                        <span className="text-sm font-semibold text-foreground tabular-nums">
                          {week.totalHours}h<span className="text-xs font-normal text-muted-foreground">/{week.targetHours}h</span>
                        </span>
                        <Badge variant="outline" className={`text-xs font-normal ${
                          week.status === "complet"
                            ? "border-green-500/50 text-green-700 dark:text-green-400"
                            : "border-red-400/50 text-red-600 dark:text-red-400"
                        }`}>
                          {week.status}
                        </Badge>
                      </div>

                      {/* Chevron */}
                      <ChevronRight className="w-4 h-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 mx-auto" />
                    </div>
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
          weeks={weeks} 
          onWeekSelect={(week) => { setPointageView("liste"); handleWeekClick(week) }}
          onAddClick={handleCalendarAdd}
          onDateClick={(date, weekNumber) => handleCalendarAdd(weekNumber, date)}
        />
      )}

      {/* ── PANEL JOUR (Sheet latéral) ──────────────────────────────────────────── */}
      <Sheet open={isDayPanelOpen} onOpenChange={(open) => {
        setIsDayPanelOpen(open)
        if (!open) setSelectedDay(null)
      }}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto p-0">
          {/* Bandeau semaine passée */}
          {selectedWeek && isPastWeek(selectedWeek.weekNumber) && (
            <div className="flex items-center gap-2 px-6 py-2.5 bg-muted/60 border-b border-border text-xs text-muted-foreground">
              <History className="w-3.5 h-3.5" />
              <span>Semaine passée — modifications encore possibles</span>
            </div>
          )}

          <div className="p-6">
            <SheetHeader className="mb-6">
              <SheetTitle className="text-xl font-bold">
                {selectedDay ? DAY_LABELS[selectedDay] : "—"}
              </SheetTitle>
              <SheetDescription className="text-sm text-muted-foreground">
                Semaine {selectedWeek?.weekNumber} · {selectedWeek?.startDate} – {selectedWeek?.endDate}
              </SheetDescription>
            </SheetHeader>

            {/* Barre de progression semaine */}
            <div className="p-3 border border-border rounded-lg bg-muted/20 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">Semaine en cours</span>
                <span className="text-xs font-medium text-foreground">
                  {formatHoursLabel(totalHoursUsed)} / {TARGET_HOURS}h
                  {remainingHours > 0 && (
                    <span className="text-muted-foreground font-normal"> · {formatHoursLabel(remainingHours)} dispo</span>
                  )}
                </span>
              </div>
              <Progress
                value={(totalHoursUsed / TARGET_HOURS) * 100}
                className={`h-1.5 bg-muted ${totalHoursUsed >= TARGET_HOURS ? "[&>div]:bg-green-500" : "[&>div]:bg-blue-500"}`}
              />
            </div>

            {/* Activités du jour */}
            <div className="space-y-3">
              {(() => {
                const dayEntries = selectedDay
                  ? (selectedWeek?.entries.filter(e => e.dayOfWeek === selectedDay) || [])
                  : []
                const dayHours = dayEntries.reduce((s, e) => s + e.hours, 0)
                const canAdd = remainingHours > 0 && dayHours < 7 &&
                  projects.filter(p => !dayEntries.map(e => e.projectId).includes(p.id)).length > 0

                return (
                  <>
                    {dayEntries.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Aucune activité pour cette journée
                      </p>
                    )}
                    {dayEntries.map((entry) => {
                      const project    = getProjectById(entry.projectId)
                      const otherHours = getOtherHours(entry.id)
                      const maxDay     = Math.min(7 - (dayHours - entry.hours), TARGET_HOURS - otherHours)

                      return (
                        <div key={entry.id} className="flex items-center gap-2 p-3 border border-border rounded-lg bg-background">
                          <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: project?.color || "#888" }} />
                          <Select value={entry.projectId} onValueChange={() => {}}>
                            <SelectTrigger className="flex-1 h-9 text-sm">
                              <SelectValue>{project?.name || "—"}</SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {projects.map(p => (
                                <SelectItem key={p.id} value={p.id}>
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: p.color }} />
                                    {p.name}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <HoursInput
                            value={entry.hours}
                            max={Math.max(0, maxDay)}
                            onChange={h => handleHoursChange(entry.id, h)}
                          />
                          <Button variant="ghost" size="icon" className="h-9 w-9 flex-shrink-0 text-muted-foreground hover:text-destructive"
                            onClick={() => handleRemoveEntry(entry.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )
                    })}

                    {/* Ajouter activité */}
                    <button
                      type="button"
                      onClick={handleAddActivity}
                      disabled={!canAdd}
                      className="w-full flex items-center justify-center gap-2 h-10 text-sm text-muted-foreground border border-dashed border-border rounded-lg hover:border-primary hover:text-primary disabled:opacity-30 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Ajouter une activité
                    </button>

                    {/* Total du jour */}
                    {dayEntries.length > 0 && (
                      <div className="flex items-center justify-between pt-2 px-1">
                        <span className="text-xs text-muted-foreground">Total du jour</span>
                        <span className={`text-sm font-semibold ${dayHours >= 7 ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`}>
                          {formatHoursLabel(dayHours)} / 7h
                        </span>
                      </div>
                    )}
                  </>
                )
              })()}
            </div>

            <Separator className="my-6" />

            <Button
              className="w-full"
              onClick={() => setIsDayPanelOpen(false)}
            >
              Enregistrer
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
