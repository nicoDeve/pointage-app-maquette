"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AppSidePanel } from "@/components/app-side-panel"
import { notifySaved } from "@/lib/notify"
import { AppLabel } from "@/lib/app-labels"
import {
  AppPanelKind,
  SupportUserStatusCode,
  SupportMainTab,
  SupportDetailTab,
  SupportMonthListScope,
  SupportMonthPhase,
} from "@/lib/app-enums"
import { uiDensity } from "@/lib/ui-density"
import { appSidePanelTokens } from "@/lib/app-side-panel-tokens"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { format, getISOWeek } from "date-fns"
import { fr } from "date-fns/locale"
import type { MonthWeekSlice, WeekEntryStatus, WorkdayStickVisualState } from "@/lib/month-iso-weeks"
import {
  buildMonthWeekSlicesForCalendarMonth,
  buildMonthExportWeekColumnTitles,
  countWorkdaysInSlice,
  HOURS_PER_WORKDAY,
  ISO_WEEKDAY_LABELS,
  monthTotalTargetHoursForSlices,
  simulateWorkdaysInSlice,
  TIMESHEET_DAY_STICK_CLASS,
  timesheetDayHoursTextClass,
  timesheetDayProgressBarClass,
  weekSliceTargetHours,
  workdayStickStatesForWeekEntry,
} from "@/lib/month-iso-weeks"
import {
  Download,
  FileSpreadsheet,
  Search,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Palmtree,
  MoreHorizontal,
  Filter,
  X,
  Briefcase,
  CalendarDays,
} from "lucide-react"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"

// ─── Types ────────────────────────────────────────────────────────────────────

interface WeekEntry {
  weekNumber: number
  hours: number
  target: number
  status: "complet" | "incomplet" | "absent"
}

interface AbsencePeriod {
  from: Date
  to: Date
  type: "conges_payes" | "maladie" | "rtt" | "sans_solde"
  label: string
  days: number
}

interface SupportUser {
  id: string
  name: string
  role: string
  department: string
  initials: string
  avatar?: string
  totalHours: number
  targetHours: number
  weeksComplete: number
  weeksTotal: number
  absenceDays: number
  status: SupportUserStatusCode
  weeks: WeekEntry[]
  absencePeriods?: AbsencePeriod[]
  // Données collaborateur enrichies
  activeProjects: number
  projectNames: string[]
  congesUsed: number
  congesTotal: number
  ttUsed: number
  ttTotal: number
}

interface MonthPeriod {
  id: string
  label: string
  shortLabel: string
  weeks: MonthWeekSlice[]
  isCurrent: boolean
}

function monthTotalTargetHoursForUser(month: MonthPeriod): number {
  return monthTotalTargetHoursForSlices(month.weeks)
}

function WeekDaySticks({ entry, slice }: { entry: WeekEntry; slice: MonthWeekSlice }) {
  const states = workdayStickStatesForWeekEntry(entry.hours, entry.status, slice, HOURS_PER_WORKDAY)
  return (
    <div className="flex h-8 items-end justify-center gap-px py-0.5 sm:h-9 sm:gap-0.5">
      {slice.workdaysInMonth.map((wd, i) => {
        const st = states[i] ?? "empty"
        const label = ISO_WEEKDAY_LABELS[wd.weekdayIndex]
        const dateStr = format(wd.date, "d MMM.", { locale: fr })
        return (
          <span
            key={`${wd.date.getTime()}-${i}`}
            title={
              st === "full"
                ? `${label} ${dateStr} — ${HOURS_PER_WORKDAY}${AppLabel.support.stickHoursLogged}`
                : st === "partial"
                  ? `${label} ${dateStr} — ${AppLabel.support.stickPartial}`
                  : st === "absent"
                    ? `${label} ${dateStr} — ${AppLabel.support.stickAbsent}`
                    : `${label} ${dateStr} — ${AppLabel.support.stickEmpty}`
            }
            className={TIMESHEET_DAY_STICK_CLASS[st]}
          />
        )
      })}
    </div>
  )
}

function LegendStick({ state }: { state: WorkdayStickVisualState }) {
  return <span className={`inline-block ${TIMESHEET_DAY_STICK_CLASS[state]}`} />
}

const FR_MONTH_LABELS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
] as const
const FR_MONTH_SHORT = [
  "janv.", "févr.", "mars", "avr.", "mai", "juin",
  "juil.", "août", "sept.", "oct.", "nov.", "déc.",
] as const

function buildMonthPeriods(): MonthPeriod[] {
  const rows: MonthPeriod[] = []
  for (let y = 2024; y <= 2027; y++) {
    for (let m = 1; m <= 12; m++) {
      const id = `${y}-${String(m).padStart(2, "0")}`
      const isOct2026 = y === 2026 && m === 10
      rows.push({
        id,
        label: `${FR_MONTH_LABELS[m - 1]} ${y}`,
        shortLabel: `${FR_MONTH_SHORT[m - 1]} ${y}`,
        weeks: buildMonthWeekSlicesForCalendarMonth(y, m - 1),
        isCurrent: isOct2026,
      })
    }
  }
  return rows
}

/** Part visible du bloc dans la fenêtre (évite un scroll inutile si l’utilisateur a déjà cliqué la carte). */
function visibleHeightRatio(el: HTMLElement): number {
  const r = el.getBoundingClientRect()
  const vh = window.innerHeight || document.documentElement.clientHeight
  const top = Math.max(r.top, 0)
  const bottom = Math.min(r.bottom, vh)
  const visible = Math.max(0, bottom - top)
  const ref = Math.min(r.height, vh)
  return ref <= 0 ? 0 : visible / ref
}

// ─── Mock data (heures caplées à 35h max) ─────────────────────────────────────

/** Données démo alignées sur oct. 2026 : semaines ISO 40→44 (2j partiels en S40, puis semaines pleines) */
const mockUsers: SupportUser[] = [
  {
    id: "u1", name: "Marie Dupont", role: "Designer UI/UX", department: "Produit",
    initials: "MD", totalHours: 154, targetHours: 154,
    weeksComplete: 5, weeksTotal: 5, absenceDays: 0, status: "complet",
    activeProjects: 3, projectNames: ["Alpha Refonte", "Design System", "App Mobile"], congesUsed: 8, congesTotal: 25, ttUsed: 2, ttTotal: 10,
    weeks: [
      { weekNumber: 40, hours: 14, target: 14, status: "complet" },
      { weekNumber: 41, hours: 35, target: 35, status: "complet" },
      { weekNumber: 42, hours: 35, target: 35, status: "complet" },
      { weekNumber: 43, hours: 35, target: 35, status: "complet" },
      { weekNumber: 44, hours: 35, target: 35, status: "complet" },
    ],
  },
  {
    id: "u2", name: "Jean Martin", role: "Developpeur Front", department: "Tech",
    initials: "JM", totalHours: 105, targetHours: 154,
    weeksComplete: 3, weeksTotal: 5, absenceDays: 3, status: "incomplet",
    activeProjects: 2, projectNames: ["Alpha Refonte", "API Gateway"], congesUsed: 12, congesTotal: 25, ttUsed: 5, ttTotal: 10,
    weeks: [
      { weekNumber: 40, hours: 14, target: 14, status: "complet" },
      { weekNumber: 41, hours: 35, target: 35, status: "complet" },
      { weekNumber: 42, hours: 0, target: 35, status: "absent" },
      { weekNumber: 43, hours: 21, target: 35, status: "incomplet" },
      { weekNumber: 44, hours: 35, target: 35, status: "complet" },
    ],
    absencePeriods: [
      { from: new Date(2026, 9, 13), to: new Date(2026, 9, 15), type: "maladie", label: "Maladie", days: 3 },
    ],
  },
  {
    id: "u3", name: "Sophie Leblanc", role: "Chef de projet", department: "Produit",
    initials: "SL", totalHours: 144, targetHours: 154,
    weeksComplete: 4, weeksTotal: 5, absenceDays: 0, status: "incomplet",
    activeProjects: 4, projectNames: ["Alpha Refonte", "Design System", "App Mobile", "Dashboard BI"], congesUsed: 5, congesTotal: 25, ttUsed: 3, ttTotal: 10,
    weeks: [
      { weekNumber: 40, hours: 14, target: 14, status: "complet" },
      { weekNumber: 41, hours: 35, target: 35, status: "complet" },
      { weekNumber: 42, hours: 35, target: 35, status: "complet" },
      { weekNumber: 43, hours: 35, target: 35, status: "complet" },
      { weekNumber: 44, hours: 25, target: 35, status: "incomplet" },
    ],
  },
  {
    id: "u4", name: "Pierre Durand", role: "Developpeur Back", department: "Tech",
    initials: "PD", totalHours: 0, targetHours: 154,
    weeksComplete: 0, weeksTotal: 5, absenceDays: 0, status: SupportUserStatusCode.EnRetard,
    activeProjects: 1, projectNames: ["API Gateway"], congesUsed: 0, congesTotal: 25, ttUsed: 0, ttTotal: 10,
    weeks: [
      { weekNumber: 40, hours: 0, target: 14, status: "incomplet" },
      { weekNumber: 41, hours: 0, target: 35, status: "incomplet" },
      { weekNumber: 42, hours: 0, target: 35, status: "incomplet" },
      { weekNumber: 43, hours: 0, target: 35, status: "incomplet" },
      { weekNumber: 44, hours: 0, target: 35, status: "incomplet" },
    ],
  },
  {
    id: "u5", name: "Lucie Bernard", role: "QA Engineer", department: "Tech",
    initials: "LB", totalHours: 133, targetHours: 154,
    weeksComplete: 2, weeksTotal: 5, absenceDays: 0, status: "incomplet",
    activeProjects: 2, projectNames: ["Alpha Refonte", "App Mobile"], congesUsed: 18, congesTotal: 25, ttUsed: 7, ttTotal: 10,
    weeks: [
      { weekNumber: 40, hours: 14, target: 14, status: "complet" },
      { weekNumber: 41, hours: 35, target: 35, status: "complet" },
      { weekNumber: 42, hours: 33, target: 35, status: "incomplet" },
      { weekNumber: 43, hours: 30, target: 35, status: "incomplet" },
      { weekNumber: 44, hours: 21, target: 35, status: "incomplet" },
    ],
  },
  {
    id: "u6", name: "Marc Petit", role: "DevOps", department: "Infra",
    initials: "MP", totalHours: 154, targetHours: 154,
    weeksComplete: 5, weeksTotal: 5, absenceDays: 0, status: "complet",
    activeProjects: 2, projectNames: ["API Gateway", "Infra K8s"], congesUsed: 3, congesTotal: 25, ttUsed: 0, ttTotal: 10,
    weeks: [
      { weekNumber: 40, hours: 14, target: 14, status: "complet" },
      { weekNumber: 41, hours: 35, target: 35, status: "complet" },
      { weekNumber: 42, hours: 35, target: 35, status: "complet" },
      { weekNumber: 43, hours: 35, target: 35, status: "complet" },
      { weekNumber: 44, hours: 35, target: 35, status: "complet" },
    ],
  },
  {
    id: "u7", name: "Emma Moreau", role: "Product Manager", department: "Produit",
    initials: "EM", totalHours: 119, targetHours: 154,
    weeksComplete: 4, weeksTotal: 5, absenceDays: 5, status: "incomplet",
    activeProjects: 3, projectNames: ["Alpha Refonte", "Dashboard BI", "App Mobile"], congesUsed: 15, congesTotal: 25, ttUsed: 4, ttTotal: 10,
    weeks: [
      { weekNumber: 40, hours: 14, target: 14, status: "complet" },
      { weekNumber: 41, hours: 35, target: 35, status: "complet" },
      { weekNumber: 42, hours: 0, target: 35, status: "absent" },
      { weekNumber: 43, hours: 35, target: 35, status: "complet" },
      { weekNumber: 44, hours: 35, target: 35, status: "complet" },
    ],
    absencePeriods: [
      { from: new Date(2026, 9, 12), to: new Date(2026, 9, 16), type: "conges_payes", label: "Congés payés", days: 5 },
    ],
  },
]

const MONTH_PERIODS: MonthPeriod[] = buildMonthPeriods()

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusConfig(status: SupportUser["status"]) {
  switch (status) {
    case SupportUserStatusCode.Complet:
      return {
        label: AppLabel.support.statusComplet,
        cls: "bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/40 dark:text-green-300",
      }
    case SupportUserStatusCode.Incomplet:
      return {
        label: AppLabel.support.statusIncomplet,
        cls: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900/35 dark:text-yellow-300",
      }
    case SupportUserStatusCode.EnRetard:
      return {
        label: AppLabel.support.statusEnRetard,
        cls: "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/40 dark:text-red-300",
      }
  }
}

/** Données semaine × user ; `target` toujours dérivé des jours ouvrés du mois (semaine partielle en bord de mois) */
function getWeekEntry(user: SupportUser, slice: MonthWeekSlice, isCurrent: boolean): WeekEntry {
  const target = weekSliceTargetHours(slice)
  const wn = slice.isoWeek
  const found = user.weeks.find(w => w.weekNumber === wn)
  if (found) return { ...found, target, weekNumber: wn }
  if (!isCurrent) return { weekNumber: wn, hours: target, target, status: "complet" }
  return { weekNumber: wn, hours: 0, target, status: "incomplet" }
}

export interface ProjectHoursRow {
  name: string
  hours: number
}

/** Répartition par projet (mois) — oct. détaillé ; autres mois complétés ou dérivés */
const PROJECT_HOURS_PRESET: Record<string, Record<string, ProjectHoursRow[]>> = {
  u1: {
    "2026-10": [{ name: "Alpha Refonte", hours: 70 }, { name: "Design System", hours: 42 }, { name: "App Mobile", hours: 28 }],
    "2026-09": [{ name: "Alpha Refonte", hours: 55 }, { name: "Design System", hours: 48 }, { name: "App Mobile", hours: 37 }],
  },
  u2: {
    "2026-10": [{ name: "Alpha Refonte", hours: 52 }, { name: "API Gateway", hours: 39 }],
    "2026-09": [{ name: "Alpha Refonte", hours: 60 }, { name: "API Gateway", hours: 80 }],
  },
  u3: {
    "2026-10": [
      { name: "Alpha Refonte", hours: 48 },
      { name: "Design System", hours: 38 },
      { name: "App Mobile", hours: 24 },
      { name: "Dashboard BI", hours: 20 },
    ],
  },
  u4: { "2026-10": [{ name: "API Gateway", hours: 0 }] },
  u5: { "2026-10": [{ name: "Alpha Refonte", hours: 68 }, { name: "App Mobile", hours: 65 }] },
  u6: { "2026-10": [{ name: "API Gateway", hours: 72 }, { name: "Infra K8s", hours: 68 }] },
  u7: {
    "2026-10": [
      { name: "Alpha Refonte", hours: 45 },
      { name: "Dashboard BI", hours: 35 },
      { name: "App Mobile", hours: 25 },
    ],
  },
}

function getProjectHoursForUserMonth(user: SupportUser, monthId: string): ProjectHoursRow[] {
  const preset = PROJECT_HOURS_PRESET[user.id]?.[monthId]
  if (preset) return preset
  const month = MONTH_PERIODS.find(m => m.id === monthId)
  if (!month) return []
  const entries = month.weeks.map(w => getWeekEntry(user, w, month.isCurrent))
  const total = entries.reduce((s, e) => s + e.hours, 0)
  const names = user.projectNames.length ? user.projectNames : [AppLabel.support.unassignedProject]
  if (names.length === 1) return [{ name: names[0], hours: total }]
  const base = Math.floor(total / names.length)
  let rem = total - base * names.length
  return names.map((name, i) => ({ name, hours: base + (i < rem ? 1 : 0) }))
}

function aggregateProjectHoursForMonth(users: SupportUser[], monthId: string): ProjectHoursRow[] {
  const map = new Map<string, number>()
  for (const u of users) {
    for (const row of getProjectHoursForUserMonth(u, monthId)) {
      if (row.hours <= 0) continue
      map.set(row.name, (map.get(row.name) ?? 0) + row.hours)
    }
  }
  return [...map.entries()].map(([name, hours]) => ({ name, hours })).sort((a, b) => b.hours - a.hours)
}

/** Synthèse globale pour le mois sélectionné (carte + popover stats) */
function getSupportOverviewForMonth(users: SupportUser[], monthId: string) {
  const month = MONTH_PERIODS.find(m => m.id === monthId)
  const totalUsers = users.length
  if (!month) {
    return {
      totalUsers,
      completeCount: 0,
      lateCount: 0,
      incompletCount: totalUsers,
      totalHours: 0,
      targetHours: 0,
    }
  }
  const perUserTarget = monthTotalTargetHoursForUser(month)
  let completeCount = 0
  let lateCount = 0
  let incompletCount = 0
  let totalHours = 0
  for (const u of users) {
    const entries = month.weeks.map(w => getWeekEntry(u, w, month.isCurrent))
    const allDone = entries.every(e => e.status === "complet")
    const sum = entries.reduce((s, e) => s + e.hours, 0)
    totalHours += sum
    if (allDone) completeCount++
    else incompletCount++
    if (month.isCurrent && u.status === SupportUserStatusCode.EnRetard) lateCount++
  }
  const targetHours = totalUsers * perUserTarget
  return { totalUsers, completeCount, lateCount, incompletCount, totalHours, targetHours }
}

/** Pour le tableau de bord : mêmes mois que la vue Support */
export const SUPPORT_REPORT_MONTH_PERIODS = MONTH_PERIODS

export function getSupportTeamProjectHoursByMonth(monthId: string): ProjectHoursRow[] {
  return aggregateProjectHoursForMonth(mockUsers, monthId)
}

function absenceTypeStyle(type: string) {
  switch (type) {
    case "conges_payes": return "bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/40 dark:text-blue-300"
    case "maladie":      return "bg-purple-100 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/40 dark:text-purple-300"
    case "rtt":          return "bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/40 dark:text-green-300"
    default:             return "bg-muted text-muted-foreground hover:bg-muted"
  }
}

function exportCSV(users: SupportUser[], label: string, month?: MonthPeriod) {
  const esc = (v: string | number) => {
    const s = String(v)
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
    return s
  }

  if (month?.weeks.length) {
    const weekCols = buildMonthExportWeekColumnTitles(month.weeks)
    const header = [
      "Nom",
      "Role",
      "Departement",
      ...weekCols,
      "Total_periode_h",
      "Objectif_periode_h",
      "Absences_j",
      "Statut",
    ]
    const rows: (string | number)[][] = [header]
    const target = monthTotalTargetHoursForUser(month)
    for (const u of users) {
      const entries = month.weeks.map(slice => getWeekEntry(u, slice, month.isCurrent))
      const total = entries.reduce((s, e) => s + e.hours, 0)
      rows.push([
        u.name,
        u.role,
        u.department,
        ...entries.map(e => e.hours),
        total,
        target,
        u.absenceDays,
        statusConfig(u.status).label,
      ])
    }
    const csv = rows.map(r => r.map(esc).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `heures-${month.id}-${label.replace(/\s/g, "-").toLowerCase()}.csv`
    a.click()
    URL.revokeObjectURL(url)
    notifySaved(
      AppLabel.support.toastExportTitle,
      AppLabel.support.toastExportDesc.replace("{file}", a.download),
    )
    return
  }

  const rows = [
    ["Nom", "Role", "Departement", "Heures saisies", "Objectif", "Semaines completes", "Absences (j)", "Statut"],
    ...users.map(u => [
      u.name,
      u.role,
      u.department,
      u.totalHours,
      u.targetHours,
      `${u.weeksComplete}/${u.weeksTotal}`,
      u.absenceDays,
      statusConfig(u.status).label,
    ]),
  ]
  const csv = rows.map(r => r.map(esc).join(",")).join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `heures-${label.replace(/\s/g, "-").toLowerCase()}.csv`
  a.click()
  URL.revokeObjectURL(url)
  notifySaved(
    AppLabel.support.toastExportTitle,
    AppLabel.support.toastExportDesc.replace("{file}", a.download),
  )
}

function filterPeriodsByScope(
  periods: MonthPeriod[],
  scope: SupportMonthListScope,
  currentPeriodId: string,
) {
  if (scope === SupportMonthListScope.All) return periods
  if (scope === SupportMonthListScope.ThroughCurrent) return periods.filter((m) => m.id <= currentPeriodId)
  return periods.filter((m) => m.id < currentPeriodId)
}

// ─── Composant ────────────────────────────────────────────────────────────────

export function SupportView() {
  const [searchQuery,      setSearchQuery]      = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | SupportUserStatusCode>("all")
  const [filterDepartment, setFilterDepartment] = useState("all")
  const [isFilterOpen,     setIsFilterOpen]     = useState(false)
  const [activeTab, setActiveTab] = useState<SupportMainTab>(SupportMainTab.Mensuel)
  const [selectedUser, setSelectedUser] = useState<SupportUser | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [sheetView, setSheetView] = useState<SupportDetailTab>(SupportDetailTab.Weekly)
  const [expandedMonthId,  setExpandedMonthId]  = useState<string | null>("2026-10")
  const [expandedAbsences, setExpandedAbsences] = useState<Set<number>>(new Set())
  const [expandedWeeks,    setExpandedWeeks]    = useState<Set<number>>(new Set())
  const [expandedDays,     setExpandedDays]     = useState<Set<string>>(new Set())
  const [reportMonthId,    setReportMonthId]    = useState<string>("2026-10")
  const [isPeriodPopoverOpen, setIsPeriodPopoverOpen] = useState(false)
  const [monthListScope, setMonthListScope] = useState<SupportMonthListScope>(SupportMonthListScope.All)

  const currentAnalyzedPeriodId = useMemo(
    () => MONTH_PERIODS.find(m => m.isCurrent)?.id ?? "2026-10",
    []
  )
  const visibleAnalysisPeriods = useMemo(
    () => filterPeriodsByScope(MONTH_PERIODS, monthListScope, currentAnalyzedPeriodId),
    [monthListScope, currentAnalyzedPeriodId]
  )

  /** Mois courant en tête (arrivée sur la page = haut), le reste du plus récent au plus ancien */
  const monthsOrderedForMonthlyView = useMemo(() => {
    const current = MONTH_PERIODS.filter(m => m.isCurrent)
    const others = MONTH_PERIODS.filter(m => !m.isCurrent).sort((a, b) => b.id.localeCompare(a.id))
    return [...current, ...others]
  }, [])

  const reportMonthMeta = MONTH_PERIODS.find(m => m.id === reportMonthId)
  const reportMonthLabel = reportMonthMeta?.label ?? ""
  const reportMonthShort = reportMonthMeta?.shortLabel ?? ""

  useEffect(() => {
    setReportMonthId(prev => {
      const vis = filterPeriodsByScope(MONTH_PERIODS, monthListScope, currentAnalyzedPeriodId)
      if (vis.length && !vis.some(m => m.id === prev)) return vis[0]!.id
      return prev
    })
  }, [monthListScope, currentAnalyzedPeriodId])

  const toggleAbsence = (i: number) =>
    setExpandedAbsences(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n })

  const toggleWeek = (wn: number) =>
    setExpandedWeeks(prev => { const n = new Set(prev); n.has(wn) ? n.delete(wn) : n.add(wn); return n })

  const toggleDay = (key: string) =>
    setExpandedDays(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n })

  const handleOpenDetail = (user: SupportUser, view: SupportDetailTab = SupportDetailTab.Weekly) => {
    setSelectedUser(user)
    setSheetView(view)
    setIsDetailOpen(true)
    setExpandedAbsences(new Set())
    setExpandedWeeks(new Set())
    setExpandedDays(new Set())
  }

  // Navigation vers l'autre onglet pour le même utilisateur
  const switchTab = (tab: SupportMainTab, view: SupportDetailTab) => {
    setActiveTab(tab)
    setSheetView(view)
    setExpandedWeeks(new Set())
    setExpandedDays(new Set())
  }

  // Couleurs des projets pour l'affichage
  const PROJECT_COLORS = ["#6366f1", "#0ea5e9", "#8b5cf6", "#f59e0b", "#10b981"]

  const filtered = mockUsers.filter(u => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (!u.name.toLowerCase().includes(q) && !u.role.toLowerCase().includes(q) && !u.department.toLowerCase().includes(q)) return false
    }
    if (filterStatus     !== "all" && u.status     !== filterStatus)     return false
    if (filterDepartment !== "all" && u.department !== filterDepartment) return false
    return true
  })

  const departments     = [...new Set(mockUsers.map(u => u.department))]
  const hasActiveFilter = filterStatus !== "all" || filterDepartment !== "all"
  const activeFilterCount = [filterStatus !== "all", filterDepartment !== "all"].filter(Boolean).length
  const clearFilters = () => { setFilterStatus("all"); setFilterDepartment("all") }

  const overview = useMemo(() => getSupportOverviewForMonth(mockUsers, reportMonthId), [reportMonthId])
  const {
    totalUsers,
    completeCount,
    lateCount,
    totalHours,
    targetHours,
  } = overview
  const completionPct =
    totalUsers > 0 ? Math.round((completeCount / totalUsers) * 100) : 0

  /** Refs des cartes mois (vue mensuelle) pour scroll lors du changement via le sélecteur */
  const monthCardRefs = useRef<Record<string, HTMLDivElement | null>>({})
  /**
   * Après ouverture par clic accordéon : pas de scroll auto (la vue suit déjà le clic).
   * Sélecteur / retour onglet : scroll seulement si la carte est peu visible → évite « mauvais mois » ressenti.
   */
  const skipScrollAfterAccordionOpenRef = useRef(false)

  const setReportMonthFromPicker = (id: string) => {
    skipScrollAfterAccordionOpenRef.current = false
    setReportMonthId(id)
  }

  /** Sélecteur ou changement d’onglet : la carte du mois sélectionné est celle qui est ouverte */
  useEffect(() => {
    setExpandedMonthId(reportMonthId)
  }, [reportMonthId, activeTab])

  /**
   * Scroll doux vers la carte du mois si elle est hors vue (sélecteur / onglet).
   * `block: "nearest"` = déplacement minimal, pas une mise en haut de page agressive.
   */
  useEffect(() => {
    if (activeTab !== SupportMainTab.Mensuel) return
    if (skipScrollAfterAccordionOpenRef.current) {
      skipScrollAfterAccordionOpenRef.current = false
      return
    }
    const el = monthCardRefs.current[reportMonthId]
    if (!el) return
    const t = window.setTimeout(() => {
      if (visibleHeightRatio(el) >= 0.28) return
      el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" })
    }, 80)
    return () => window.clearTimeout(t)
  }, [reportMonthId, activeTab])

  /** Clic sur l’en-tête : replier, ou ouvrir ce mois et aligner le sélecteur */
  const handleMonthHeaderClick = (monthId: string) => {
    if (expandedMonthId === monthId) {
      setExpandedMonthId(null)
    } else {
      skipScrollAfterAccordionOpenRef.current = true
      setReportMonthId(monthId)
      setExpandedMonthId(monthId)
    }
  }

  const supportDetailTitle =
    selectedUser != null ? (
      <div className="flex min-w-0 items-center gap-3">
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarFallback className="bg-muted text-xs text-muted-foreground">{selectedUser.initials}</AvatarFallback>
        </Avatar>
        <span className="truncate">{selectedUser.name}</span>
      </div>
    ) : (
      "—"
    )
  const supportDetailDescription =
    selectedUser != null ? `${selectedUser.role} · ${selectedUser.department}` : undefined

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className={cn(uiDensity.pageStack, "pb-6")}>
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as SupportMainTab)} className="w-full">
        {/* Bandeau : même espacement que Absences / `pageStack` (pas de bordure bas de page) */}
        <div className="flex flex-col gap-3">
          <HoverCard openDelay={200} closeDelay={80}>
            <HoverCardTrigger asChild>
              <div
                className="block w-full cursor-default rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                tabIndex={0}
                role="button"
                aria-label={`${AppLabel.support.overviewTitle} — ${AppLabel.support.overviewPopoverTitle}`}
              >
                <div
                  className={cn(
                    "group/support-kpi grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
                    uiDensity.gridGap,
                  )}
                >
                  <Card className="gap-0 border border-border py-0 shadow-sm transition-colors group-hover/support-kpi:border-primary/35">
                    <CardContent className={cn(uiDensity.cardPad, "space-y-2")}>
                      <div className="flex items-center justify-between gap-2">
                        <span className={uiDensity.kpiLabel}>{AppLabel.support.overviewStatTeam}</span>
                        <Users className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className={uiDensity.kpiValue}>{totalUsers}</span>
                        <span className="text-xs text-muted-foreground">{AppLabel.support.overviewStatCollabShort}</span>
                      </div>
                      <p className={uiDensity.kpiHint}>{reportMonthLabel || AppLabel.support.periodAnalyzedTitle}</p>
                    </CardContent>
                  </Card>
                  <Card className="gap-0 border border-border py-0 shadow-sm transition-colors group-hover/support-kpi:border-primary/35">
                    <CardContent className={cn(uiDensity.cardPad, "space-y-2")}>
                      <div className="flex items-center justify-between gap-2">
                        <span className={uiDensity.kpiLabel}>{AppLabel.support.overviewStatComplete}</span>
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold tabular-nums leading-none text-green-600 dark:text-green-400">
                          {completeCount}
                        </span>
                        <span className="text-xs text-muted-foreground">/ {totalUsers}</span>
                      </div>
                      <Progress
                        value={totalUsers > 0 ? (completeCount / totalUsers) * 100 : 0}
                        className="h-1 bg-muted [&>div]:bg-green-500"
                      />
                      <p className={uiDensity.kpiHint}>
                        {completionPct}% · {AppLabel.support.overviewTooltipCompletionRate}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="gap-0 border border-border py-0 shadow-sm transition-colors group-hover/support-kpi:border-primary/35">
                    <CardContent className={cn(uiDensity.cardPad, "space-y-2")}>
                      <div className="flex items-center justify-between gap-2">
                        <span className={uiDensity.kpiLabel}>{AppLabel.support.overviewStatLate}</span>
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      </div>
                      <span
                        className={cn(
                          uiDensity.kpiValue,
                          lateCount > 0 ? "text-red-600 dark:text-red-400" : "",
                        )}
                      >
                        {lateCount}
                      </span>
                      <p className={uiDensity.kpiHint}>{AppLabel.support.overviewCardLateFooter}</p>
                    </CardContent>
                  </Card>
                  <Card className="gap-0 border border-border py-0 shadow-sm transition-colors group-hover/support-kpi:border-primary/35">
                    <CardContent className={cn(uiDensity.cardPad, "space-y-2")}>
                      <div className="flex items-center justify-between gap-2">
                        <span className={uiDensity.kpiLabel}>{AppLabel.support.overviewStatHours}</span>
                        <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className={uiDensity.kpiValue}>{totalHours}</span>
                        <span className="text-xs text-muted-foreground">/ {targetHours}h</span>
                      </div>
                      <Progress
                        value={targetHours > 0 ? Math.min(100, (totalHours / targetHours) * 100) : 0}
                        className="h-1 bg-muted [&>div]:bg-blue-500"
                      />
                      <p className={uiDensity.kpiHint}>{AppLabel.support.overviewTooltipHoursLogged}</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </HoverCardTrigger>
            <HoverCardContent
              side="bottom"
              align="start"
              sideOffset={8}
              className="w-80 max-w-[min(100vw-2rem,20rem)] border border-border p-4 text-xs shadow-md"
            >
              <p className="mb-1 font-semibold text-foreground">{AppLabel.support.overviewPopoverTitle}</p>
              <p className="mb-3 text-[11px] leading-snug text-muted-foreground">
                {reportMonthLabel || AppLabel.support.periodAnalyzedTitle}
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <span className="font-medium text-foreground">{AppLabel.support.overviewTooltipCollaborators}</span>{" "}
                  {totalUsers}
                </li>
                <li>
                  <span className="font-medium text-foreground">{AppLabel.support.overviewTooltipHoursLogged}</span>{" "}
                  {totalHours}h / {targetHours}h
                </li>
                <li>
                  <span className="font-medium text-foreground">{AppLabel.support.overviewTooltipCompletionRate}</span>{" "}
                  {completionPct}%
                </li>
                <li>
                  <span className="font-medium text-foreground">{AppLabel.support.overviewTooltipComplete}</span>{" "}
                  {completeCount} / {totalUsers}
                </li>
                <li className={lateCount === 0 ? "opacity-80" : ""}>
                  <span className="font-medium text-foreground">{AppLabel.support.overviewTooltipLate}</span> {lateCount}
                </li>
                <li className="opacity-90">
                  <span className="font-medium text-foreground">{AppLabel.support.overviewTooltipIncomplete}</span>{" "}
                  {overview.incompletCount}
                </li>
              </ul>
            </HoverCardContent>
          </HoverCard>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-x-4 sm:gap-y-3">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Popover open={isPeriodPopoverOpen} onOpenChange={setIsPeriodPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={`h-8 gap-2 sm:h-9 ${monthListScope !== SupportMonthListScope.All ? "border-primary/40 bg-primary/5 text-primary" : ""}`}
                >
                  <CalendarDays className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                  <span className="max-w-[9rem] truncate text-xs sm:max-w-[12rem] sm:text-sm">{reportMonthLabel}</span>
                  <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
                  {monthListScope !== SupportMonthListScope.All && (
                    <Badge variant="secondary" className="h-5 min-w-5 shrink-0 rounded-full px-1 text-[10px]">
                      {monthListScope === SupportMonthListScope.ThroughCurrent ? "≤" : "<"}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-0 shadow-lg border border-border/50" align="start">
                <div className="flex items-center justify-between border-b border-border bg-muted/50 px-4 py-3">
                  <span className="text-sm font-semibold text-foreground">{AppLabel.support.periodAnalyzedTitle}</span>
                  <button
                    type="button"
                    className="text-xs text-muted-foreground transition-colors hover:text-primary"
                    onClick={() => {
                      setMonthListScope(SupportMonthListScope.All)
                    }}
                  >
                    {AppLabel.support.periodResetScope}
                  </button>
                </div>
                <div className="space-y-3 border-b border-border p-3">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {AppLabel.support.periodScopeTitle}
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {(
                      [
                        { id: SupportMonthListScope.All, label: AppLabel.support.periodScopeAll },
                        { id: SupportMonthListScope.ThroughCurrent, label: AppLabel.support.periodScopeThroughCurrent },
                        { id: SupportMonthListScope.PastOnly, label: AppLabel.support.periodScopePastOnly },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setMonthListScope(opt.id)}
                        className={`rounded-md border px-3 py-2 text-left text-xs font-medium transition-all ${
                          monthListScope === opt.id
                            ? "border-primary bg-background text-primary"
                            : "border-transparent bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="px-2 pt-2">
                  <p className="mb-1.5 px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {AppLabel.support.periodPickMonth}
                  </p>
                  <ScrollArea className="h-56 rounded-md border border-border/60">
                    <div className="p-1">
                      {visibleAnalysisPeriods.length === 0 ? (
                        <p className="px-2 py-4 text-center text-xs text-muted-foreground">
                          {AppLabel.support.periodEmptyScope}
                        </p>
                      ) : (
                        visibleAnalysisPeriods.map(m => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => {
                              setReportMonthFromPicker(m.id)
                              setIsPeriodPopoverOpen(false)
                            }}
                            className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-muted ${
                              m.id === reportMonthId ? "bg-muted font-medium" : ""
                            }`}
                          >
                            <span className="min-w-0 truncate">{m.label}</span>
                            {m.isCurrent ? (
                              <span className="shrink-0 text-xs text-muted-foreground">
                                {AppLabel.support.periodCurrentTag}
                              </span>
                            ) : null}
                          </button>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </div>
                <div className="border-t border-border bg-muted/30 px-3 py-2">
                  <Button variant="ghost" size="sm" className="h-8 w-full" onClick={() => setIsPeriodPopoverOpen(false)}>
                    {AppLabel.common.close}
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
            <Button
              variant="outline"
              size="sm"
              className="h-8 shrink-0 gap-2 sm:h-9"
              onClick={() => exportCSV(mockUsers, reportMonthLabel || "export", reportMonthMeta)}
            >
              <FileSpreadsheet className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">{AppLabel.support.exportGlobalCsv}</span>
              <span className="sm:hidden">{AppLabel.support.exportGlobalCsvShort}</span>
            </Button>
            </div>
            <TabsList className="inline-flex h-8 w-fit shrink-0 rounded-md bg-muted/50 p-0.5 sm:h-9">
              <TabsTrigger
                value={SupportMainTab.Mensuel}
                className="rounded-sm px-3 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm sm:text-sm"
              >
                {AppLabel.support.tabMonthly}
              </TabsTrigger>
              <TabsTrigger
                value={SupportMainTab.Collaborateurs}
                className="rounded-sm px-3 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm sm:text-sm"
              >
                {AppLabel.support.tabByUser}
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        {/* ── Onglet collaborateurs ───────────────────────────────────── */}
        <TabsContent value={SupportMainTab.Collaborateurs} className={cn(uiDensity.pageStack, "mt-3")}>
          {/* Filtres */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={AppLabel.support.searchPlaceholder}
                className="pl-9 h-9"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={`h-9 gap-2 transition-all ${hasActiveFilter ? "border-primary/50 bg-primary/5 text-primary" : ""}`}
                >
                  <Filter className="w-4 h-4" />
                  {AppLabel.support.filtersButton}
                  {hasActiveFilter && (
                    <Badge variant="secondary" className="ml-1 size-5 shrink-0 rounded-full p-0 flex items-center justify-center text-xs tabular-nums">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-0 shadow-lg border border-border/50" align="end">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-muted/50">
                  <span className="text-sm font-semibold text-foreground">Filtres</span>
                  {hasActiveFilter && (
                    <button onClick={clearFilters} className="text-xs text-muted-foreground hover:text-primary transition-colors">
                      Effacer tout
                    </button>
                  )}
                </div>

                <div className="p-4 space-y-4">
                  {/* Statut */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {AppLabel.support.filterStatusLabel}
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(
                        [
                          { value: "all" as const, label: AppLabel.support.filterStatusAll },
                          { value: SupportUserStatusCode.Complet, label: AppLabel.support.filterStatusComplete },
                          { value: SupportUserStatusCode.Incomplet, label: AppLabel.support.filterStatusIncomplete },
                          { value: SupportUserStatusCode.EnRetard, label: AppLabel.support.filterStatusLate },
                        ] as const
                      ).map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setFilterStatus(opt.value)}
                          className={`px-3 py-2 text-xs font-medium rounded-md border transition-all ${
                            filterStatus === opt.value
                              ? "border-primary text-primary bg-background"
                              : "border-transparent bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Département */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {AppLabel.support.filterDeptLabel}
                    </label>
                    <div className="flex flex-col gap-1.5">
                      {["all", ...departments].map(dept => (
                        <button
                          key={dept}
                          onClick={() => setFilterDepartment(dept)}
                          className={`px-3 py-2 text-xs font-medium rounded-md border text-left transition-all ${
                            filterDepartment === dept
                              ? "border-primary text-primary bg-background"
                              : "border-transparent bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`}
                        >
                          {dept === "all" ? AppLabel.support.filterDeptAll : dept}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="px-4 py-3 border-t border-border bg-muted/30">
                  <Button className="w-full h-9" size="sm" onClick={() => setIsFilterOpen(false)}>
                    {AppLabel.support.filtersApply}
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            {/* Active filter chips */}
            {hasActiveFilter && (
              <div className="flex items-center gap-1.5">
                {filterStatus !== "all" && (
                  <Badge variant="secondary" className="gap-1 pr-1 text-xs">
                    {filterStatus === SupportUserStatusCode.Complet
                      ? AppLabel.support.filterStatusComplete
                      : filterStatus === SupportUserStatusCode.Incomplet
                        ? AppLabel.support.filterStatusIncomplete
                        : AppLabel.support.filterStatusLate}
                    <button onClick={() => setFilterStatus("all")} className="ml-0.5 hover:bg-muted rounded-full p-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {filterDepartment !== "all" && (
                  <Badge variant="secondary" className="gap-1 pr-1 text-xs">
                    {filterDepartment}
                    <button onClick={() => setFilterDepartment("all")} className="ml-0.5 hover:bg-muted rounded-full p-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Liste */}
          <div className="border border-border rounded-lg overflow-hidden">
            {/* En-têtes */}
            <div className="grid grid-cols-[1fr_80px_120px_110px_100px_32px_32px] items-center border-b border-border bg-muted/40 px-4 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <span>{AppLabel.support.listColCollaborator}</span>
              <span className="text-center">{AppLabel.support.listColProjects}</span>
              <span className="text-center">{AppLabel.support.listColLeave}</span>
              <span className="text-center">{AppLabel.support.listColHoursMonth}</span>
              <span className="text-center">{AppLabel.support.listColStatus}</span>
              <span />
              <span />
            </div>

            <div className="divide-y divide-border">
              {filtered.map(user => {
                const sc = statusConfig(user.status)
                const reportMonth = MONTH_PERIODS.find(m => m.id === reportMonthId)
                const monthHoursForReport = reportMonth
                  ? reportMonth.weeks.reduce(
                      (s, slice) => s + getWeekEntry(user, slice, reportMonth.isCurrent).hours,
                      0
                    )
                  : user.totalHours
                const monthTargetForReport = reportMonth
                  ? monthTotalTargetHoursForUser(reportMonth)
                  : user.targetHours
                const progress = Math.min(100, (monthHoursForReport / Math.max(monthTargetForReport, 1)) * 100)

                const weekLines = reportMonth
                  ? reportMonth.weeks.map((slice) => {
                      const e = getWeekEntry(user, slice, reportMonth.isCurrent)
                      return {
                        label: `S${slice.isoWeek} (${countWorkdaysInSlice(slice)}j)`,
                        value: `${e.hours}h / ${e.target}h`,
                        subtle: e.status === "absent",
                      }
                    })
                  : []

                const congesLines = [
                  { label: AppLabel.support.statCpUsed, value: `${user.congesUsed}j / ${user.congesTotal}j` },
                  { label: AppLabel.support.statCpRemaining, value: `${user.congesTotal - user.congesUsed}j` },
                  { label: AppLabel.support.statTtUsed, value: `${user.ttUsed}j / ${user.ttTotal}j` },
                  { label: AppLabel.support.statTtRemaining, value: `${user.ttTotal - user.ttUsed}j`, subtle: true as const },
                  { label: AppLabel.support.statAbsenceOther, value: `${user.absenceDays}j`, subtle: true as const },
                ]

                return (
                  <ContextMenu key={user.id}>
                    <ContextMenuTrigger asChild>
                  <div
                    className={cn(
                      "grid grid-cols-[1fr_80px_120px_110px_100px_32px_32px] items-center transition-colors hover:bg-muted/30 cursor-pointer group",
                      uiDensity.listRowCompact,
                    )}
                    onClick={() => handleOpenDetail(user, SupportDetailTab.Profile)}
                  >
                    {/* Identité */}
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                          {user.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.role} · {user.department}</p>
                      </div>
                    </div>

                    {/* Projets en cours */}
                    <div className="flex justify-center" onClick={e => e.stopPropagation()}>
                      <Badge variant="outline" className="text-xs font-normal gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
                        {user.activeProjects}
                      </Badge>
                    </div>

                    {/* Congés (CP + TT) — détail au survol */}
                    <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                      <Tooltip delayDuration={200}>
                        <TooltipTrigger asChild>
                          <div className="inline-flex cursor-default items-center gap-1">
                            <Badge
                              variant="outline"
                              className="border-violet-300 text-xs font-normal text-violet-600 dark:border-violet-700 dark:text-violet-400"
                            >
                              CP {user.congesTotal - user.congesUsed}j
                            </Badge>
                            <Badge
                              variant="outline"
                              className="border-sky-300 text-xs font-normal text-sky-600 dark:border-sky-700 dark:text-sky-400"
                            >
                              TT {user.ttTotal - user.ttUsed}j
                            </Badge>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="right" align="start" className="max-w-xs border border-border p-3 text-xs">
                          <p className="font-semibold text-foreground">{user.name}</p>
                          <p className="mb-2 text-muted-foreground">{AppLabel.support.congesPopoverTitle}</p>
                          <ul className="space-y-1">
                            {congesLines.map((row) => (
                              <li
                                key={row.label}
                                className={row.subtle ? "text-muted-foreground/90" : "text-foreground"}
                              >
                                <span className="font-medium">{row.label}</span> {row.value}
                              </li>
                            ))}
                          </ul>
                          {weekLines.length > 0 && (
                            <>
                              <p className="mb-1 mt-3 font-medium text-foreground">{AppLabel.support.panelWeekDetailTitle}</p>
                              <ul className="space-y-1 text-muted-foreground">
                                {weekLines.map((row) => (
                                  <li key={row.label} className={row.subtle ? "opacity-75" : ""}>
                                    <span className="font-medium text-foreground">{row.label}</span> {row.value}
                                  </li>
                                ))}
                              </ul>
                            </>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    </div>

                    {/* Heures sur le mois du rapport */}
                    <div className="px-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-foreground tabular-nums">{monthHoursForReport}h</span>
                        <span className="text-xs text-muted-foreground tabular-nums">{monthTargetForReport}h</span>
                      </div>
                      <Progress
                        value={progress}
                        className={`h-1 bg-muted ${
                          user.status === SupportUserStatusCode.EnRetard ? "[&>div]:bg-red-500" : "[&>div]:bg-blue-500"
                        }`}
                      />
                    </div>

                    {/* Statut */}
                    <div className="flex justify-center">
                      <Badge className={`text-xs font-normal ${sc.cls}`}>{sc.label}</Badge>
                    </div>

                    {/* Chevron */}
                    <ChevronRight className="w-4 h-4 text-muted-foreground transition-transform group-hover:translate-x-1 mx-auto" />

                    {/* Context menu */}
                    <div className="flex justify-center" onClick={e => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="w-7 h-7 flex items-center justify-center rounded-md opacity-0 group-hover:opacity-100 hover:bg-muted transition-all">
                            <MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onClick={() => exportCSV([user], user.name, reportMonthMeta)}>
                            <Download className="w-4 h-4 mr-2" />
                            {AppLabel.support.exportCsv}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleOpenDetail(user, SupportDetailTab.Profile)}>
                            <ChevronRight className="w-4 h-4 mr-2" />
                            {AppLabel.support.viewDetail}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                    </ContextMenuTrigger>
                    <ContextMenuContent className="w-48">
                      <ContextMenuItem onSelect={() => exportCSV([user], user.name, reportMonthMeta)}>
                        <Download className="mr-2 h-4 w-4" />
                        {AppLabel.support.exportCsv}
                      </ContextMenuItem>
                      <ContextMenuSeparator />
                      <ContextMenuItem onSelect={() => handleOpenDetail(user, SupportDetailTab.Profile)}>
                        <ChevronRight className="mr-2 h-4 w-4" />
                        {AppLabel.support.viewDetail}
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                )
              })}

              {filtered.length === 0 && (
                <div className="py-10 text-center text-xs text-muted-foreground">
                  {AppLabel.support.listEmptyFilters}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ── Onglet vue mensuelle ────────────────────────────────────── */}
        <TabsContent value={SupportMainTab.Mensuel} className={cn(uiDensity.pageStack, "mt-3")}>
          {monthsOrderedForMonthlyView.map(month => {
            const isExpanded = expandedMonthId === month.id
            const isPastMonth = month.id < currentAnalyzedPeriodId
            const isFutureMonth = month.id > currentAnalyzedPeriodId

            // Calcul du statut du mois à partir des données réelles (ou simulées)
            const monthCompletions = mockUsers.map(user => {
              const entries = month.weeks.map(w => getWeekEntry(user, w, month.isCurrent))
              const allDone = entries.every(e => e.status === "complet")
              return allDone
            })
            const completeUsers  = monthCompletions.filter(Boolean).length
            const allComplete    = completeUsers === mockUsers.length
            const monthStatus = !month.isCurrent
              ? SupportMonthPhase.Archive
              : allComplete
                ? SupportMonthPhase.Complet
                : SupportMonthPhase.EnCours

            const archivedVisual =
              month.isCurrent
                ? ""
                : isPastMonth || isFutureMonth
                  ? "opacity-40 transition-opacity hover:opacity-[0.72]"
                  : ""

            return (
              <div
                key={month.id}
                ref={el => {
                  monthCardRefs.current[month.id] = el
                }}
                className={`scroll-mt-20 overflow-hidden rounded-lg border border-border ${archivedVisual} ${
                  month.isCurrent ? "ring-1 ring-blue-500/25" : ""
                }`}
              >
                {/* En-tête du mois — courant comme semaine « en cours » dans Pointage */}
                <button
                  type="button"
                  className={`flex w-full items-center justify-between px-4 py-3 transition-colors ${
                    month.isCurrent
                      ? "border-l-4 border-l-blue-600 hover:bg-muted/20 dark:border-l-blue-500"
                      : "hover:bg-muted/30"
                  }`}
                  onClick={() => handleMonthHeaderClick(month.id)}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold text-foreground">{month.label}</span>
                    {month.isCurrent && (
                      <Badge
                        variant="outline"
                        className="border-amber-400/60 text-xs font-normal text-amber-700 dark:text-amber-400"
                      >
                        {AppLabel.support.monthCurrentBadge}
                      </Badge>
                    )}
                    <Badge
                      className={`text-xs font-normal ${
                        monthStatus === SupportMonthPhase.Archive
                          ? "bg-muted text-muted-foreground hover:bg-muted"
                          : monthStatus === SupportMonthPhase.Complet
                            ? "bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/40 dark:text-green-300"
                            : "bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/40 dark:text-amber-300"
                      }`}
                    >
                      {monthStatus === SupportMonthPhase.Archive && AppLabel.support.monthPhaseArchive}
                      {monthStatus === SupportMonthPhase.Complet && AppLabel.support.monthPhaseComplete}
                      {monthStatus === SupportMonthPhase.EnCours && AppLabel.support.monthPhaseInProgress}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-xs text-muted-foreground">
                      {completeUsers}/{mockUsers.length} {AppLabel.support.monthCompleteSummary}
                    </span>
                    {/* Barre de progression du mois */}
                    <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${monthStatus === SupportMonthPhase.Complet ? "bg-green-500" : "bg-blue-500"}`}
                        style={{ width: `${(completeUsers / mockUsers.length) * 100}%` }}
                      />
                    </div>
                    {/* Bouton export */}
                    <div onClick={e => e.stopPropagation()}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2.5 gap-1.5 text-xs"
                        onClick={() => exportCSV(mockUsers, month.label, month)}
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        {AppLabel.support.exportShort}
                      </Button>
                    </div>
                    {isExpanded
                      ? <ChevronUp   className="w-4 h-4 text-muted-foreground" />
                      : <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    }
                  </div>
                </button>

                {/* Grille croisée user × semaine */}
                {isExpanded && (
                  <div className="border-t border-border overflow-x-auto">
                    <table className="w-full text-xs">
                      {/* Colonnes */}
                      <thead>
                        <tr className="bg-muted/40 border-b border-border">
                          <th className="w-44 px-4 py-2 text-left font-medium text-muted-foreground">
                            {AppLabel.support.tableColCollaborator}
                          </th>
                          {month.weeks.map(slice => (
                            <th
                              key={`${slice.isoWeekYear}-${slice.isoWeek}`}
                              className="w-[4.5rem] min-w-[4.5rem] px-1.5 py-2 text-center font-medium text-muted-foreground sm:w-24 sm:min-w-[5.5rem] sm:px-3"
                            >
                              <div className="flex flex-col items-center gap-0.5 leading-tight">
                                <span>S{slice.isoWeek}</span>
                                <span className="text-[10px] font-normal tabular-nums text-muted-foreground/80">
                                  {countWorkdaysInSlice(slice)}j
                                </span>
                              </div>
                            </th>
                          ))}
                          <th className="w-24 px-3 py-2 text-center font-medium text-muted-foreground">
                            {AppLabel.support.tableColTotal}
                          </th>
                          <th className="w-24 px-3 py-2 text-center font-medium text-muted-foreground">
                            {AppLabel.support.tableColStatus}
                          </th>
                          <th className="w-8 px-1" aria-hidden />
                          <th className="w-10 px-1" aria-label={AppLabel.support.tableActionsAria} />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {mockUsers.map(user => {
                          const entries = month.weeks.map(slice => ({
                            slice,
                            entry: getWeekEntry(user, slice, month.isCurrent),
                          }))
                          const monthTotal = entries.reduce((s, { entry }) => s + entry.hours, 0)
                          const monthTarget = monthTotalTargetHoursForUser(month)
                          const allDone = entries.every(({ entry }) => entry.status === "complet")
                          const sc = allDone
                            ? statusConfig(SupportUserStatusCode.Complet)
                            : statusConfig(user.status)

                          return (
                            <ContextMenu key={user.id}>
                              <ContextMenuTrigger asChild>
                            <tr
                              className="hover:bg-muted/30 transition-colors cursor-pointer group"
                              onClick={() => handleOpenDetail(user, SupportDetailTab.Weekly)}
                            >
                              {/* Utilisateur */}
                              <td className="px-4 py-2.5">
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-6 w-6 flex-shrink-0">
                                    <AvatarFallback className="text-[10px] bg-muted text-muted-foreground">
                                      {user.initials}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="font-medium text-foreground truncate">{user.name}</span>
                                </div>
                              </td>

                              {entries.map(({ slice, entry }) => (
                                <td
                                  key={`${slice.isoWeekYear}-${slice.isoWeek}`}
                                  className="px-1.5 py-2 text-center sm:px-3"
                                >
                                  <WeekDaySticks entry={entry} slice={slice} />
                                </td>
                              ))}

                              {/* Total mois */}
                              <td className="px-3 py-2.5 text-center">
                                <span className="font-semibold text-foreground">{monthTotal}h</span>
                                <span className="text-muted-foreground">/{monthTarget}h</span>
                              </td>

                              {/* Statut */}
                              <td className="px-3 py-2.5 text-center">
                                <Badge className={`text-[11px] font-normal ${sc.cls}`}>
                                  {sc.label}
                                </Badge>
                              </td>

                              {/* Chevron */}
                              <td className="px-1 py-2.5 text-center">
                                <ChevronRight className="mx-auto h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                              </td>
                              <td className="px-1 py-2.5" onClick={e => e.stopPropagation()}>
                                <div className="flex justify-center">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <button
                                        type="button"
                                        className="flex h-7 w-7 items-center justify-center rounded-md opacity-0 transition-all hover:bg-muted group-hover:opacity-100"
                                        aria-label={AppLabel.support.tableActionsAria}
                                      >
                                        <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                                      </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-44">
                                      <DropdownMenuItem onClick={() => exportCSV([user], user.name, month)}>
                                        <Download className="mr-2 h-4 w-4" />
                                        {AppLabel.support.exportCsv}
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={() => handleOpenDetail(user, SupportDetailTab.Weekly)}>
                                        <ChevronRight className="mr-2 h-4 w-4" />
                                        {AppLabel.support.viewDetail}
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </td>
                            </tr>
                              </ContextMenuTrigger>
                              <ContextMenuContent className="w-48">
                                <ContextMenuItem onSelect={() => exportCSV([user], user.name, month)}>
                                  <Download className="mr-2 h-4 w-4" />
                                  {AppLabel.support.exportCsv}
                                </ContextMenuItem>
                                <ContextMenuSeparator />
                                <ContextMenuItem onSelect={() => handleOpenDetail(user, SupportDetailTab.Weekly)}>
                                  <ChevronRight className="mr-2 h-4 w-4" />
                                  {AppLabel.support.viewDetail}
                                </ContextMenuItem>
                              </ContextMenuContent>
                            </ContextMenu>
                          )
                        })}
                      </tbody>
                    </table>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border bg-muted/20 px-4 py-3">
                      <span className="text-xs font-medium text-muted-foreground">{AppLabel.support.legendTitle}</span>
                      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                        <LegendStick state="full" />
                        {AppLabel.support.legendDayFilled}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                        <LegendStick state="partial" />
                        {AppLabel.support.legendPartial}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                        <LegendStick state="empty" />
                        {AppLabel.support.legendEmpty}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                        <LegendStick state="absent" />
                        {AppLabel.support.legendAbsent}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </TabsContent>
      </Tabs>

      <AppSidePanel
        open={isDetailOpen}
        onOpenChange={(open) => {
          setIsDetailOpen(open)
          if (!open) setSelectedUser(null)
        }}
        width="wide"
        panelKind={AppPanelKind.SupportUserDetail}
        title={supportDetailTitle}
        description={supportDetailDescription}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2 border-b border-border pb-2">
            <Tabs value={sheetView} onValueChange={(v) => setSheetView(v as SupportDetailTab)}>
              <TabsList className="h-8">
                <TabsTrigger value={SupportDetailTab.Weekly} className="px-2.5 text-xs">
                  {AppLabel.support.panelTabWeeks}
                </TabsTrigger>
                <TabsTrigger value={SupportDetailTab.Profile} className="px-2.5 text-xs">
                  {AppLabel.support.panelTabProfile}
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 shrink-0"
              aria-label={AppLabel.support.panelExportCsvAria}
              onClick={() => selectedUser && exportCSV([selectedUser], selectedUser.name, reportMonthMeta)}
            >
              <Download className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* ── VUE SEMAINES ─────────────────────────────────────────────── */}
          {sheetView === SupportDetailTab.Weekly && (
              <>
                {(() => {
                  const sheetRm = MONTH_PERIODS.find(m => m.id === reportMonthId)
                  const sheetMonthHours =
                    sheetRm && selectedUser
                      ? sheetRm.weeks.reduce(
                          (s, sl) => s + getWeekEntry(selectedUser, sl, sheetRm.isCurrent).hours,
                          0
                        )
                      : (selectedUser?.totalHours ?? 0)
                  const sheetMonthTarget =
                    sheetRm && selectedUser ? monthTotalTargetHoursForUser(sheetRm) : (selectedUser?.targetHours ?? 1)
                  return (
                <div className={cn(appSidePanelTokens.summaryBox, "flex items-center justify-between")}>
                  <div>
                    <p className={cn(appSidePanelTokens.summaryLabel, "mb-1")}>
                      {reportMonthLabel || AppLabel.support.panelPeriodFallback}
                    </p>
                    <div className="flex items-baseline gap-1">
                      <span className={cn(uiDensity.kpiValue)}>{sheetMonthHours}h</span>
                      <span className="text-xs text-muted-foreground">/ {sheetMonthTarget}h</span>
                    </div>
                    <Progress
                      value={Math.min((sheetMonthHours / Math.max(sheetMonthTarget, 1)) * 100, 100)}
                      className="mt-2 h-1.5 w-40 bg-muted [&>div]:bg-blue-500"
                    />
                  </div>
                  {selectedUser && (
                    <Badge className={`text-xs font-normal ${statusConfig(selectedUser.status).cls}`}>
                      {statusConfig(selectedUser.status).label}
                    </Badge>
                  )}
                </div>
                  )
                })()}

                {/* Accordion semaines → jours → projets */}
                <div className="space-y-1.5">
                  <p className={cn(uiDensity.sectionTitle, "uppercase tracking-wider text-muted-foreground")}>
                    {AppLabel.support.panelWeekDetailTitle}
                  </p>
                  <div className="divide-y divide-border overflow-hidden rounded-lg border border-border">
                    {selectedUser?.weeks.map(week => {
                      const isExpanded = expandedWeeks.has(week.weekNumber)
                      const reportSlices = MONTH_PERIODS.find(m => m.id === reportMonthId)?.weeks ?? []
                      const slice = reportSlices.find(s => s.isoWeek === week.weekNumber)
                      const days = slice
                        ? simulateWorkdaysInSlice(slice, week.hours, week.status as WeekEntryStatus, HOURS_PER_WORKDAY)
                        : []
                      const wCls =
                        week.status === "absent"
                          ? "border-0 bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-950/45 dark:text-red-300"
                          : week.status === "complet"
                            ? "border-0 bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/40 dark:text-green-300"
                            : "border-0 bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900/35 dark:text-yellow-300"
                      return (
                        <div key={week.weekNumber}>
                          <button
                            type="button"
                            className={cn(
                              uiDensity.listRowCompact,
                              "flex w-full items-center justify-between text-left transition-colors hover:bg-muted/30",
                            )}
                            onClick={() => toggleWeek(week.weekNumber)}
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-7 text-xs font-semibold text-foreground">S{week.weekNumber}</span>
                              <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                                <div
                                  className={`h-full rounded-full ${week.status === "absent" ? "bg-red-500" : week.status === "complet" ? "bg-green-500" : "bg-yellow-500"}`}
                                  style={{ width: `${Math.min((week.hours / Math.max(week.target, 1)) * 100, 100)}%` }}
                                />
                              </div>
                              <span className="text-xs text-foreground">{week.hours}h</span>
                              <span className="text-[11px] text-muted-foreground">/ {week.target}h</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={`text-xs font-normal ${wCls}`}>
                                {week.status === "absent"
                                  ? AppLabel.support.panelWeekBadgeAbsent
                                  : week.status === "complet"
                                    ? AppLabel.support.statusComplet
                                    : AppLabel.support.statusIncomplet}
                              </Badge>
                              {isExpanded ? (
                                <ChevronUp className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                              )}
                            </div>
                          </button>

                          {isExpanded && (
                            <div className="divide-y divide-border/60 border-t border-border bg-muted/10">
                              {!slice ? (
                                <p className="px-4 py-3 text-xs text-muted-foreground">
                                  {AppLabel.support.panelWeekNoWorkdaysInMonth.replace("{month}", reportMonthLabel)}
                                </p>
                              ) : (
                                days.map((d, di) => {
                                  const dayKey = `${week.weekNumber}-${format(d.date, "yyyy-MM-dd")}`
                                  const isDayOpen = expandedDays.has(dayKey)
                                  const pn = selectedUser?.projectNames
                                  const projects =
                                    d.hours > 0 && !d.absent && pn?.length
                                      ? [pn[di % pn.length]!]
                                      : []

                                  return (
                                    <div key={dayKey}>
                                      <button
                                        type="button"
                                        className={`flex w-full items-center justify-between px-4 py-2.5 text-left transition-colors ${
                                          d.hours > 0 && !d.absent ? "cursor-pointer hover:bg-muted/30" : "cursor-default"
                                        }`}
                                        onClick={() => d.hours > 0 && !d.absent && toggleDay(dayKey)}
                                        disabled={d.hours === 0 || d.absent}
                                      >
                                        <div className="flex items-center gap-3">
                                          <span className="w-24 shrink-0 text-xs font-medium capitalize text-muted-foreground">
                                            {d.label}
                                          </span>
                                          {d.absent ? (
                                            <Badge className="text-xs font-normal bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-950/45 dark:text-red-300">
                                              {AppLabel.support.panelWeekBadgeAbsent}
                                            </Badge>
                                          ) : (
                                            <div className="flex items-center gap-2">
                                              <div className="h-1 w-16 overflow-hidden rounded-full bg-muted">
                                                <div
                                                  className={`h-full rounded-full ${timesheetDayProgressBarClass(d.hours)}`}
                                                  style={{
                                                    width: `${Math.min(100, (d.hours / HOURS_PER_WORKDAY) * 100)}%`,
                                                  }}
                                                />
                                              </div>
                                              <span className={`text-xs font-medium ${timesheetDayHoursTextClass(d.hours)}`}>
                                                {d.hours > 0 ? `${d.hours}h` : "—"}
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                        {d.hours > 0 && !d.absent && (
                                          isDayOpen ? (
                                            <ChevronUp className="h-3 w-3 text-muted-foreground" />
                                          ) : (
                                            <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                          )
                                        )}
                                      </button>

                                      {isDayOpen && projects.length > 0 && (
                                        <div className="space-y-1.5 border-t border-border/60 bg-muted/20 px-4 py-2">
                                          {projects.map((projName, pi) => (
                                            <div key={pi} className="flex items-center justify-between">
                                              <div className="flex items-center gap-2">
                                                <span
                                                  className="h-2 w-2 shrink-0 rounded-sm"
                                                  style={{ backgroundColor: PROJECT_COLORS[pi % PROJECT_COLORS.length] }}
                                                />
                                                <span className="text-xs text-foreground">{projName}</span>
                                              </div>
                                              <span className="text-xs text-muted-foreground">{d.hours}h</span>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )
                                })
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                <Separator />
                {/* Lien vers le profil */}
                <button
                  type="button"
                  onClick={() => switchTab(SupportMainTab.Collaborateurs, SupportDetailTab.Profile)}
                  className="flex w-full items-center justify-center gap-2 text-xs text-muted-foreground transition-colors hover:text-primary"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                  {AppLabel.support.panelLinkFullProfile} {selectedUser?.name.split(" ")[0]}
                </button>
              </>
            )}

            {sheetView === SupportDetailTab.Profile && (
              <>
                <Card className="group cursor-default border border-border transition-shadow hover:shadow-md">
                  <CardContent className="p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-medium text-foreground">{AppLabel.support.panelResourcesCardTitle}</span>
                      <Users className="h-3.5 w-3.5 text-muted-foreground transition-colors group-hover:text-primary" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="mb-0.5 text-[11px] text-muted-foreground">{AppLabel.support.panelProjectsActive}</p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg font-bold tabular-nums text-foreground">
                            {selectedUser?.activeProjects ?? 0}
                          </span>
                          <span className="text-[11px] text-muted-foreground">{AppLabel.support.panelProjectsOngoing}</span>
                        </div>
                        <div className="mt-1 space-y-0.5">
                          {selectedUser?.projectNames?.slice(0, 2).map((p, i) => (
                            <div key={i} className="flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-sm" style={{ backgroundColor: PROJECT_COLORS[i] }} />
                              <span className="max-w-[90px] truncate text-[11px] text-muted-foreground">{p}</span>
                            </div>
                          ))}
                          {(selectedUser?.projectNames?.length ?? 0) > 2 && (
                            <span className="text-[11px] text-muted-foreground">
                              +{(selectedUser?.projectNames?.length ?? 0) - 2} {AppLabel.support.panelProjectsMore}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <p className="mb-0.5 text-[11px] text-muted-foreground">{AppLabel.support.panelCpRemaining}</p>
                          <div className="flex items-baseline gap-0.5">
                            <span className="text-lg font-bold tabular-nums text-violet-600 dark:text-violet-400">
                              {(selectedUser?.congesTotal ?? 0) - (selectedUser?.congesUsed ?? 0)}
                            </span>
                            <span className="text-[11px] text-muted-foreground">/ {selectedUser?.congesTotal ?? 0}j</span>
                          </div>
                          <Progress
                            value={((selectedUser?.congesUsed ?? 0) / (selectedUser?.congesTotal ?? 1)) * 100}
                            className="mt-1 h-1 bg-muted [&>div]:bg-violet-500"
                          />
                        </div>
                        <div>
                          <p className="mb-0.5 text-[11px] text-muted-foreground">{AppLabel.support.panelTtRemaining}</p>
                          <div className="flex items-baseline gap-0.5">
                            <span className="text-lg font-bold tabular-nums text-sky-600 dark:text-sky-400">
                              {(selectedUser?.ttTotal ?? 0) - (selectedUser?.ttUsed ?? 0)}
                            </span>
                            <span className="text-[11px] text-muted-foreground">/ {selectedUser?.ttTotal ?? 0}j</span>
                          </div>
                          <Progress
                            value={((selectedUser?.ttUsed ?? 0) / (selectedUser?.ttTotal ?? 1)) * 100}
                            className="mt-1 h-1 bg-muted [&>div]:bg-sky-500"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Separator />
                <div className="space-y-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs font-medium text-foreground">{AppLabel.support.panelHoursByProject}</span>
                    </div>
                    <p className="pl-5 text-[11px] text-muted-foreground">
                      {AppLabel.support.panelHoursByProjectSubtitle} {reportMonthLabel}
                    </p>
                  </div>
                  <Card className="border border-border">
                    <CardContent className="space-y-2 p-3">
                      {selectedUser &&
                        (() => {
                          const rows = getProjectHoursForUserMonth(selectedUser, reportMonthId)
                          const totalProj = rows.reduce((s, r) => s + r.hours, 0)
                          if (rows.length === 0) {
                            return (
                              <p className="text-xs text-muted-foreground">{AppLabel.support.panelNoSplitForMonth}</p>
                            )
                          }
                          return (
                            <>
                              {rows.map((r, i) => (
                                <div key={r.name} className="flex items-center justify-between gap-2 text-xs">
                                  <span className="flex min-w-0 items-center gap-2 truncate text-muted-foreground">
                                    <span
                                      className="h-2 w-2 shrink-0 rounded-sm"
                                      style={{ backgroundColor: PROJECT_COLORS[i % PROJECT_COLORS.length] }}
                                    />
                                    {r.name}
                                  </span>
                                  <span className="shrink-0 font-semibold tabular-nums">{r.hours}h</span>
                                </div>
                              ))}
                              <Separator />
                              <div className="flex justify-between text-xs font-medium">
                                <span>
                                  {AppLabel.support.panelTotalForMonth} ({reportMonthShort})
                                </span>
                                <span className="tabular-nums">{totalProj}h</span>
                              </div>
                            </>
                          )
                        })()}
                    </CardContent>
                  </Card>
                </div>

                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Palmtree className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium text-foreground">{AppLabel.support.panelLeaveSection}</span>
                  </div>
                  {(selectedUser?.absencePeriods?.length ?? 0) > 0 ? (
                    selectedUser!.absencePeriods!.map((period, i) => {
                      const isOpen = expandedAbsences.has(i)
                      const weekNum = getISOWeek(period.from)
                      return (
                        <div key={i} className="rounded-lg border border-border">
                          <button
                            type="button"
                            className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-muted/30"
                            onClick={() => toggleAbsence(i)}
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="outline" className={`text-xs font-normal ${absenceTypeStyle(period.type)}`}>
                                {period.label}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {period.days}{" "}
                                {period.days > 1 ? AppLabel.support.panelLeaveDays : AppLabel.support.panelLeaveDay}
                              </span>
                              <span className="text-xs text-muted-foreground">·</span>
                              <span className="text-xs font-medium text-foreground">S{weekNum}</span>
                            </div>
                            <div className="ml-2 flex flex-shrink-0 items-center gap-2">
                              <span className="whitespace-nowrap text-xs text-muted-foreground">
                                {format(period.from, "d MMM", { locale: fr })} → {format(period.to, "d MMM", { locale: fr })}
                              </span>
                              {isOpen ? (
                                <ChevronUp className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                              )}
                            </div>
                          </button>
                          {isOpen && (
                            <div className="pointer-events-none flex select-none justify-center border-t border-border bg-muted/20 py-3">
                              <Calendar
                                mode="range"
                                selected={{ from: period.from, to: period.to }}
                                defaultMonth={period.from}
                                numberOfMonths={1}
                                showOutsideDays={false}
                                className="p-1"
                              />
                            </div>
                          )}
                        </div>
                      )
                    })
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border/80 bg-muted/20 px-4 py-6 text-center">
                      <Palmtree className="h-7 w-7 text-muted-foreground/40" />
                      <p className="text-xs font-medium text-muted-foreground">{AppLabel.support.panelNoAbsencesTitle}</p>
                      <p className="max-w-xs text-[11px] text-muted-foreground/90">{AppLabel.support.panelNoAbsencesDesc}</p>
                    </div>
                  )}
                </div>
              </>
            )}
        </div>
      </AppSidePanel>
    </div>
  )
}
