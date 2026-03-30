"use client"

import { createContext, useContext, useState, ReactNode } from "react"

export interface Project {
  id: string
  name: string
  color: string
}

export type DayOfWeek = "lun" | "mar" | "mer" | "jeu" | "ven"

export interface TimeEntry {
  id: string
  projectId: string
  hours: number
  dayOfWeek: DayOfWeek
}

export interface WeekData {
  id: string
  weekNumber: number
  /** Année ISO de la semaine (ex. semaine 1 peut être en janvier de l’année N+1). Maquette : 2026. */
  isoWeekYear?: number
  startDate: string
  endDate: string
  totalHours: number
  targetHours: number
  status: "complet" | "incomplet" | "en_attente"
  isCurrent: boolean
  projectCount: number
  absenceCount: number
  entries: TimeEntry[]
  tags: string[]
}

export interface Absence {
  id: string
  type: "conges_payes" | "maladie" | "sans_solde" | "teletravail"
  typeLabel: string
  startDate: string
  endDate: string
  duration: number
  status: "approuvee" | "en_attente" | "refusee"
  weekId?: string
  dayOfWeek?: DayOfWeek
}

interface TimesheetContextType {
  projects: Project[]
  weeks: WeekData[]
  absences: Absence[]
  currentView: "dashboard" | "pointage" | "absence" | "admin" | "support"
  pointageView: "liste" | "calendrier"
  setCurrentView: (view: "dashboard" | "pointage" | "absence" | "admin" | "support") => void
  setPointageView: (view: "liste" | "calendrier") => void
  addTimeEntry: (weekId: string, entry: Omit<TimeEntry, "id">) => void
  updateTimeEntry: (weekId: string, entryId: string, hours: number) => void
  updateTimeEntryProject: (weekId: string, entryId: string, projectId: string) => void
  removeTimeEntry: (weekId: string, entryId: string) => void
  addAbsence: (absence: Omit<Absence, "id">) => void
  removeAbsence: (id: string) => void
  getTotalHoursThisMonth: () => number
  getCompletedWeeksCount: () => number
  getPendingAbsencesCount: () => number
  getCongesBalance: () => { used: number; total: number }
}

const TimesheetContext = createContext<TimesheetContextType | undefined>(undefined)

const initialProjects: Project[] = [
  { id: "1", name: "text-davinci-003", color: "#3b82f6" },
  { id: "2", name: "Projet Beta", color: "#10b981" },
  { id: "3", name: "Support Client", color: "#f59e0b" },
  { id: "4", name: "Formation", color: "#8b5cf6" },
]

const initialWeeks: WeekData[] = [
  // ── Semaines passées ─────────────────────────────────────────────────────────
  {
    id: "w33",
    weekNumber: 33,
    startDate: "10 août",
    endDate: "14 août 2026",
    totalHours: 35,
    targetHours: 35,
    status: "complet",
    isCurrent: false,
    projectCount: 2,
    absenceCount: 0,
    tags: [],
    entries: [
      { id: "w33e1", projectId: "1", hours: 7, dayOfWeek: "lun" },
      { id: "w33e2", projectId: "1", hours: 7, dayOfWeek: "mar" },
      { id: "w33e3", projectId: "2", hours: 7, dayOfWeek: "mer" },
      { id: "w33e4", projectId: "1", hours: 7, dayOfWeek: "jeu" },
      { id: "w33e5", projectId: "2", hours: 7, dayOfWeek: "ven" },
    ],
  },
  {
    id: "w34",
    weekNumber: 34,
    startDate: "17 août",
    endDate: "21 août 2026",
    totalHours: 35,
    targetHours: 35,
    status: "complet",
    isCurrent: false,
    projectCount: 3,
    absenceCount: 0,
    tags: [],
    entries: [
      { id: "w34e1", projectId: "1", hours: 7,   dayOfWeek: "lun" },
      { id: "w34e2", projectId: "3", hours: 3.5, dayOfWeek: "mar" },
      { id: "w34e3", projectId: "4", hours: 3.5, dayOfWeek: "mar" },
      { id: "w34e4", projectId: "1", hours: 7,   dayOfWeek: "mer" },
      { id: "w34e5", projectId: "3", hours: 7,   dayOfWeek: "jeu" },
      { id: "w34e6", projectId: "4", hours: 7,   dayOfWeek: "ven" },
    ],
  },
  {
    id: "w35",
    weekNumber: 35,
    startDate: "25 aoû",
    endDate: "29 aoû 2026",
    totalHours: 21,
    targetHours: 35,
    status: "incomplet",
    isCurrent: false,
    projectCount: 1,
    absenceCount: 2,
    tags: [],
    entries: [
      { id: "w35e1", projectId: "2", hours: 7, dayOfWeek: "lun" },
      { id: "w35e2", projectId: "2", hours: 7, dayOfWeek: "mar" },
      { id: "w35e3", projectId: "2", hours: 7, dayOfWeek: "mer" },
    ],
  },
  {
    id: "w36",
    weekNumber: 36,
    startDate: "31 août",
    endDate: "4 sept. 2026",
    totalHours: 35,
    targetHours: 35,
    status: "complet",
    isCurrent: false,
    projectCount: 2,
    absenceCount: 0,
    tags: [],
    entries: [
      { id: "w36e1", projectId: "1", hours: 7,   dayOfWeek: "lun" },
      { id: "w36e2", projectId: "1", hours: 7,   dayOfWeek: "mar" },
      { id: "w36e3", projectId: "3", hours: 3.5, dayOfWeek: "mer" },
      { id: "w36e4", projectId: "1", hours: 3.5, dayOfWeek: "mer" },
      { id: "w36e5", projectId: "3", hours: 7,   dayOfWeek: "jeu" },
      { id: "w36e6", projectId: "1", hours: 7,   dayOfWeek: "ven" },
    ],
  },
  {
    id: "w37",
    weekNumber: 37,
    startDate: "7 sept.",
    endDate: "11 sept. 2026",
    totalHours: 35,
    targetHours: 35,
    status: "complet",
    isCurrent: false,
    projectCount: 3,
    absenceCount: 0,
    tags: [],
    entries: [
      { id: "w37e1", projectId: "1", hours: 7,   dayOfWeek: "lun" },
      { id: "w37e2", projectId: "2", hours: 3.5, dayOfWeek: "mar" },
      { id: "w37e3", projectId: "4", hours: 3.5, dayOfWeek: "mar" },
      { id: "w37e4", projectId: "1", hours: 7,   dayOfWeek: "mer" },
      { id: "w37e5", projectId: "2", hours: 7,   dayOfWeek: "jeu" },
      { id: "w37e6", projectId: "4", hours: 7,   dayOfWeek: "ven" },
    ],
  },
  {
    id: "w38",
    weekNumber: 38,
    startDate: "15 sep",
    endDate: "19 sep 2026",
    totalHours: 14,
    targetHours: 35,
    status: "incomplet",
    isCurrent: false,
    projectCount: 1,
    absenceCount: 3,
    tags: [],
    entries: [
      { id: "w38e1", projectId: "3", hours: 7, dayOfWeek: "lun" },
      { id: "w38e2", projectId: "3", hours: 7, dayOfWeek: "mar" },
    ],
  },
  {
    id: "w39",
    weekNumber: 39,
    startDate: "21 sept.",
    endDate: "25 sept. 2026",
    totalHours: 35,
    targetHours: 35,
    status: "complet",
    isCurrent: false,
    projectCount: 3,
    absenceCount: 0,
    tags: [],
    entries: [
      { id: "e1a", projectId: "1", hours: 7,   dayOfWeek: "lun" },
      { id: "e1b", projectId: "2", hours: 3.5, dayOfWeek: "mar" },
      { id: "e1c", projectId: "4", hours: 3.5, dayOfWeek: "mar" },
      { id: "e1d", projectId: "1", hours: 7,   dayOfWeek: "mer" },
      { id: "e1e", projectId: "2", hours: 7,   dayOfWeek: "jeu" },
      { id: "e1f", projectId: "1", hours: 7,   dayOfWeek: "ven" },
    ],
  },
  {
    id: "w40",
    weekNumber: 40,
    startDate: "29 sep",
    endDate: "03 oct 2026",
    totalHours: 28,     // 4 jours travaillés × 7h (jeudi = maladie)
    targetHours: 35,
    status: "complet",  // complet car jour maladie comptabilisé
    isCurrent: false,
    projectCount: 2,
    absenceCount: 1,
    tags: [],
    entries: [
      { id: "e4a", projectId: "1", hours: 7, dayOfWeek: "lun" },
      { id: "e4b", projectId: "3", hours: 7, dayOfWeek: "mar" },
      { id: "e4c", projectId: "1", hours: 7, dayOfWeek: "mer" },
      // jeu → maladie (absence a4)
      { id: "e4e", projectId: "1", hours: 7, dayOfWeek: "ven" },
    ],
  },
  // ── Semaine courante ─────────────────────────────────────────────────────────
  {
    id: "w41",
    weekNumber: 41,
    startDate: "5 oct.",
    endDate: "9 oct. 2026",
    totalHours: 20,
    targetHours: 35,
    status: "incomplet",
    isCurrent: true,
    projectCount: 1,
    absenceCount: 0,
    tags: [],
    entries: [
      { id: "e6a", projectId: "1", hours: 7, dayOfWeek: "lun" },
      { id: "e6b", projectId: "1", hours: 7, dayOfWeek: "mar" },
      { id: "e6c", projectId: "1", hours: 6, dayOfWeek: "mer" },
    ],
  },
  // ── Semaines à venir ─────────────────────────────────────────────────────────
  {
    id: "w42",
    weekNumber: 42,
    startDate: "13 oct",
    endDate: "17 oct 2026",
    totalHours: 0,
    targetHours: 35,
    status: "incomplet",
    isCurrent: false,
    projectCount: 0,
    absenceCount: 0,
    tags: [],
    entries: [],
  },
  {
    id: "w43",
    weekNumber: 43,
    startDate: "19 oct.",
    endDate: "23 oct. 2026",
    totalHours: 0,
    targetHours: 35,
    status: "incomplet",
    isCurrent: false,
    projectCount: 0,
    absenceCount: 0,
    tags: [],
    entries: [],
  },
  {
    id: "w44",
    weekNumber: 44,
    startDate: "26 oct.",
    endDate: "30 oct. 2026",
    totalHours: 0,
    targetHours: 35,
    status: "incomplet",
    isCurrent: false,
    projectCount: 0,
    absenceCount: 0,
    tags: [],
    entries: [],
  },
  {
    id: "w45",
    weekNumber: 45,
    startDate: "03 nov",
    endDate: "07 nov 2026",
    totalHours: 0,
    targetHours: 35,
    status: "incomplet",
    isCurrent: false,
    projectCount: 0,
    absenceCount: 0,
    tags: [],
    entries: [],
  },
  {
    id: "w46",
    weekNumber: 46,
    startDate: "9 nov.",
    endDate: "13 nov. 2026",
    totalHours: 0,
    targetHours: 35,
    status: "incomplet",
    isCurrent: false,
    projectCount: 0,
    absenceCount: 0,
    tags: [],
    entries: [],
  },
]

const initialAbsences: Absence[] = [
  {
    id: "a1",
    type: "conges_payes",
    typeLabel: "Congés payés",
    startDate: "10 févr.",
    endDate: "11 févr. 2026",
    duration: 1,
    status: "approuvee",
  },
  {
    id: "a2",
    type: "conges_payes",
    typeLabel: "Congés payés",
    startDate: "14 avr.",
    endDate: "18 avr. 2026",
    duration: 5,
    status: "en_attente",
  },
  {
    id: "a3",
    type: "sans_solde",
    typeLabel: "Sans solde",
    startDate: "23 déc.",
    endDate: "27 déc. 2025",
    duration: 5,
    status: "refusee",
  },
  {
    id: "a4",
    type: "maladie",
    typeLabel: "Maladie",
    startDate: "02 oct. 2026",
    endDate: "02 oct. 2026",
    duration: 1,
    status: "approuvee",
    weekId: "w40",
    dayOfWeek: "jeu",
  },
]

export function TimesheetProvider({ children }: { children: ReactNode }) {
  const [projects] = useState<Project[]>(initialProjects)
  const [weeks, setWeeks] = useState<WeekData[]>(initialWeeks)
  const [absences, setAbsences] = useState<Absence[]>(initialAbsences)
  const [currentView, setCurrentView] = useState<"dashboard" | "pointage" | "absence" | "admin" | "support">("dashboard")
  const [pointageView, setPointageView] = useState<"liste" | "calendrier">("liste")

  const addTimeEntry = (weekId: string, entry: Omit<TimeEntry, "id">) => {
    setWeeks((prev) =>
      prev.map((week) => {
        if (week.id === weekId) {
          const newEntry = { ...entry, id: `e${Date.now()}` }
          const newEntries = [...week.entries, newEntry]
          const newTotal = newEntries.reduce((sum, e) => sum + e.hours, 0)
          return { 
            ...week, 
            entries: newEntries, 
            totalHours: newTotal,
            projectCount: newEntries.length,
            status: newTotal >= week.targetHours ? "complet" : "incomplet"
          }
        }
        return week
      })
    )
  }

  const updateTimeEntry = (weekId: string, entryId: string, hours: number) => {
    setWeeks((prev) =>
      prev.map((week) => {
        if (week.id === weekId) {
          const newEntries = week.entries.map((entry) =>
            entry.id === entryId ? { ...entry, hours } : entry
          )
          const newTotal = newEntries.reduce((sum, e) => sum + e.hours, 0)
          return { 
            ...week, 
            entries: newEntries, 
            totalHours: newTotal,
            status: newTotal >= week.targetHours ? "complet" : "incomplet"
          }
        }
        return week
      })
    )
  }

  const updateTimeEntryProject = (weekId: string, entryId: string, projectId: string) => {
    setWeeks((prev) =>
      prev.map((week) => {
        if (week.id !== weekId) return week
        const newEntries = week.entries.map((entry) =>
          entry.id === entryId ? { ...entry, projectId } : entry
        )
        return { ...week, entries: newEntries }
      })
    )
  }

  const removeTimeEntry = (weekId: string, entryId: string) => {
    setWeeks((prev) =>
      prev.map((week) => {
        if (week.id === weekId) {
          const newEntries = week.entries.filter((entry) => entry.id !== entryId)
          const newTotal = newEntries.reduce((sum, e) => sum + e.hours, 0)
          return { 
            ...week, 
            entries: newEntries, 
            totalHours: newTotal,
            projectCount: newEntries.length,
            status: newTotal >= week.targetHours ? "complet" : "incomplet"
          }
        }
        return week
      })
    )
  }

  const addAbsence = (absence: Omit<Absence, "id">) => {
    const newAbsence = { ...absence, id: `a${Date.now()}` }
    setAbsences((prev) => [newAbsence, ...prev])
  }

  const removeAbsence = (id: string) => {
    setAbsences((prev) => prev.filter((a) => a.id !== id))
  }

  const getTotalHoursThisMonth = () => {
    return weeks.reduce((sum, week) => sum + week.totalHours, 0)
  }

  const getCompletedWeeksCount = () => {
    return weeks.filter((w) => w.status === "complet").length
  }

  const getPendingAbsencesCount = () => {
    return absences.filter((a) => a.status === "en_attente").length
  }

  const getCongesBalance = () => {
    const used = absences
      .filter((a) => a.type === "conges_payes" && a.status !== "refusee")
      .reduce((sum, a) => sum + a.duration, 0)
    return { used, total: 25 }
  }

  return (
    <TimesheetContext.Provider
      value={{
        projects,
        weeks,
        absences,
        currentView,
        pointageView,
        setCurrentView,
        setPointageView,
        addTimeEntry,
        updateTimeEntry,
        updateTimeEntryProject,
        removeTimeEntry,
        addAbsence,
        removeAbsence,
        getTotalHoursThisMonth,
        getCompletedWeeksCount,
        getPendingAbsencesCount,
        getCongesBalance,
      }}
    >
      {children}
    </TimesheetContext.Provider>
  )
}

export function useTimesheet() {
  const context = useContext(TimesheetContext)
  if (context === undefined) {
    throw new Error("useTimesheet must be used within a TimesheetProvider")
  }
  return context
}
