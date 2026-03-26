"use client"

import { createContext, useContext, useState, ReactNode } from "react"

export interface Project {
  id: string
  name: string
  color: string
}

export interface TimeEntry {
  id: string
  projectId: string
  hours: number
}

export interface WeekData {
  id: string
  weekNumber: number
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
  type: "conges_payes" | "maladie" | "sans_solde"
  typeLabel: string
  startDate: string
  endDate: string
  duration: number
  status: "approuvee" | "en_attente" | "refusee"
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
  removeTimeEntry: (weekId: string, entryId: string) => void
  addAbsence: (absence: Omit<Absence, "id">) => void
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
  {
    id: "w39",
    weekNumber: 39,
    startDate: "oct 16",
    endDate: "oct 22, 2026",
    totalHours: 35,
    targetHours: 35,
    status: "complet",
    isCurrent: false,
    projectCount: 3,
    absenceCount: 0,
    tags: [],
    entries: [
      { id: "e1", projectId: "1", hours: 20 },
      { id: "e2", projectId: "2", hours: 10 },
      { id: "e3", projectId: "4", hours: 5 },
    ],
  },
  {
    id: "w40",
    weekNumber: 40,
    startDate: "oct 9",
    endDate: "oct 15, 2026",
    totalHours: 35,
    targetHours: 35,
    status: "complet",
    isCurrent: false,
    projectCount: 2,
    absenceCount: 1,
    tags: [],
    entries: [
      { id: "e4", projectId: "1", hours: 20 },
      { id: "e5", projectId: "3", hours: 15 },
    ],
  },
  {
    id: "w41",
    weekNumber: 41,
    startDate: "oct 02",
    endDate: "oct 08, 2026",
    totalHours: 20,
    targetHours: 35,
    status: "incomplet",
    isCurrent: true,
    projectCount: 0,
    absenceCount: 0,
    tags: ["work", "important"],
    entries: [
      { id: "e6", projectId: "1", hours: 20 },
    ],
  },
  {
    id: "w42",
    weekNumber: 42,
    startDate: "sep 25",
    endDate: "oct 01, 2026",
    totalHours: 0,
    targetHours: 35,
    status: "incomplet",
    isCurrent: false,
    projectCount: 0,
    absenceCount: 0,
    tags: ["work", "important"],
    entries: [],
  },
  {
    id: "w43",
    weekNumber: 43,
    startDate: "sep 25",
    endDate: "oct 01, 2026",
    totalHours: 0,
    targetHours: 35,
    status: "complet",
    isCurrent: false,
    projectCount: 0,
    absenceCount: 0,
    tags: ["work", "important"],
    entries: [],
  },
  {
    id: "w44",
    weekNumber: 44,
    startDate: "sep 25",
    endDate: "oct 01, 2026",
    totalHours: 0,
    targetHours: 35,
    status: "incomplet",
    isCurrent: false,
    projectCount: 0,
    absenceCount: 0,
    tags: ["work", "important"],
    entries: [],
  },
  {
    id: "w45",
    weekNumber: 45,
    startDate: "sep 25",
    endDate: "oct 01, 2026",
    totalHours: 0,
    targetHours: 35,
    status: "incomplet",
    isCurrent: false,
    projectCount: 0,
    absenceCount: 0,
    tags: ["work", "important"],
    entries: [],
  },
  {
    id: "w46",
    weekNumber: 46,
    startDate: "sep 25",
    endDate: "oct 01, 2026",
    totalHours: 0,
    targetHours: 35,
    status: "incomplet",
    isCurrent: false,
    projectCount: 0,
    absenceCount: 0,
    tags: ["work", "important"],
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
        removeTimeEntry,
        addAbsence,
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
