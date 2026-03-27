"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { InfoCardPopover } from "@/components/info-card-popover"
import type { StatRow } from "@/components/info-card-popover"
import { Calendar } from "@/components/ui/calendar"
import { format, getISOWeek } from "date-fns"
import { fr } from "date-fns/locale"
import {
  Download,
  FileSpreadsheet,
  Search,
  Users,
  Clock,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Palmtree,
  MoreHorizontal,
  Filter,
  X,
} from "lucide-react"

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
  status: "complet" | "incomplet" | "en_retard"
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
  weekNumbers: number[]
  isCurrent: boolean
}

// ─── Mock data (heures caplées à 35h max) ─────────────────────────────────────

const mockUsers: SupportUser[] = [
  {
    id: "u1", name: "Marie Dupont", role: "Designer UI/UX", department: "Produit",
    initials: "MD", totalHours: 140, targetHours: 140,
    weeksComplete: 4, weeksTotal: 4, absenceDays: 0, status: "complet",
    activeProjects: 3, projectNames: ["Alpha Refonte", "Design System", "App Mobile"], congesUsed: 8, congesTotal: 25, ttUsed: 2, ttTotal: 10,
    weeks: [
      { weekNumber: 38, hours: 35, target: 35, status: "complet" },
      { weekNumber: 39, hours: 35, target: 35, status: "complet" },
      { weekNumber: 40, hours: 35, target: 35, status: "complet" },
      { weekNumber: 41, hours: 35, target: 35, status: "complet" },
    ],
  },
  {
    id: "u2", name: "Jean Martin", role: "Developpeur Front", department: "Tech",
    initials: "JM", totalHours: 91, targetHours: 140,
    weeksComplete: 2, weeksTotal: 4, absenceDays: 3, status: "incomplet",
    activeProjects: 2, projectNames: ["Alpha Refonte", "API Gateway"], congesUsed: 12, congesTotal: 25, ttUsed: 5, ttTotal: 10,
    weeks: [
      { weekNumber: 38, hours: 35, target: 35, status: "complet" },
      { weekNumber: 39, hours: 35, target: 35, status: "complet" },
      { weekNumber: 40, hours: 0,  target: 35, status: "absent"   },
      { weekNumber: 41, hours: 21, target: 35, status: "incomplet" },
    ],
    absencePeriods: [
      { from: new Date(2026, 8, 28), to: new Date(2026, 8, 30), type: "maladie", label: "Maladie", days: 3 },
    ],
  },
  {
    id: "u3", name: "Sophie Leblanc", role: "Chef de projet", department: "Produit",
    initials: "SL", totalHours: 130, targetHours: 140,
    weeksComplete: 3, weeksTotal: 4, absenceDays: 0, status: "incomplet",
    activeProjects: 4, projectNames: ["Alpha Refonte", "Design System", "App Mobile", "Dashboard BI"], congesUsed: 5, congesTotal: 25, ttUsed: 3, ttTotal: 10,
    weeks: [
      { weekNumber: 38, hours: 35, target: 35, status: "complet"  },
      { weekNumber: 39, hours: 35, target: 35, status: "complet"  },
      { weekNumber: 40, hours: 35, target: 35, status: "complet"  },
      { weekNumber: 41, hours: 25, target: 35, status: "incomplet" },
    ],
  },
  {
    id: "u4", name: "Pierre Durand", role: "Developpeur Back", department: "Tech",
    initials: "PD", totalHours: 0, targetHours: 140,
    weeksComplete: 0, weeksTotal: 4, absenceDays: 0, status: "en_retard",
    activeProjects: 1, projectNames: ["API Gateway"], congesUsed: 0, congesTotal: 25, ttUsed: 0, ttTotal: 10,
    weeks: [
      { weekNumber: 38, hours: 0, target: 35, status: "incomplet" },
      { weekNumber: 39, hours: 0, target: 35, status: "incomplet" },
      { weekNumber: 40, hours: 0, target: 35, status: "incomplet" },
      { weekNumber: 41, hours: 0, target: 35, status: "incomplet" },
    ],
  },
  {
    id: "u5", name: "Lucie Bernard", role: "QA Engineer", department: "Tech",
    initials: "LB", totalHours: 133, targetHours: 140,
    weeksComplete: 2, weeksTotal: 4, absenceDays: 0, status: "incomplet",
    activeProjects: 2, projectNames: ["Alpha Refonte", "App Mobile"], congesUsed: 18, congesTotal: 25, ttUsed: 7, ttTotal: 10,
    weeks: [
      { weekNumber: 38, hours: 35, target: 35, status: "complet"  },
      { weekNumber: 39, hours: 35, target: 35, status: "complet"  },
      { weekNumber: 40, hours: 33, target: 35, status: "incomplet" },
      { weekNumber: 41, hours: 30, target: 35, status: "incomplet" },
    ],
  },
  {
    id: "u6", name: "Marc Petit", role: "DevOps", department: "Infra",
    initials: "MP", totalHours: 140, targetHours: 140,
    weeksComplete: 4, weeksTotal: 4, absenceDays: 0, status: "complet",
    activeProjects: 2, projectNames: ["API Gateway", "Infra K8s"], congesUsed: 3, congesTotal: 25, ttUsed: 0, ttTotal: 10,
    weeks: [
      { weekNumber: 38, hours: 35, target: 35, status: "complet" },
      { weekNumber: 39, hours: 35, target: 35, status: "complet" },
      { weekNumber: 40, hours: 35, target: 35, status: "complet" },
      { weekNumber: 41, hours: 35, target: 35, status: "complet" },
    ],
  },
  {
    id: "u7", name: "Emma Moreau", role: "Product Manager", department: "Produit",
    initials: "EM", totalHours: 105, targetHours: 140,
    weeksComplete: 3, weeksTotal: 4, absenceDays: 5, status: "incomplet",
    activeProjects: 3, projectNames: ["Alpha Refonte", "Dashboard BI", "App Mobile"], congesUsed: 15, congesTotal: 25, ttUsed: 4, ttTotal: 10,
    weeks: [
      { weekNumber: 38, hours: 35, target: 35, status: "complet" },
      { weekNumber: 39, hours: 35, target: 35, status: "complet" },
      { weekNumber: 40, hours: 0,  target: 35, status: "absent"   },
      { weekNumber: 41, hours: 35, target: 35, status: "complet"  },
    ],
    absencePeriods: [
      { from: new Date(2026, 8, 28), to: new Date(2026, 9, 2), type: "conges_payes", label: "Congés payés", days: 5 },
    ],
  },
]

// Mois disponibles — octobre = données réelles, les autres simulés complets
const MONTH_PERIODS: MonthPeriod[] = [
  { id: "2026-10", label: "Octobre 2026",   shortLabel: "Oct 2026", weekNumbers: [38, 39, 40, 41], isCurrent: true  },
  { id: "2026-09", label: "Septembre 2026", shortLabel: "Sep 2026", weekNumbers: [35, 36, 37, 38], isCurrent: false },
  { id: "2026-08", label: "Aout 2026",      shortLabel: "Aou 2026", weekNumbers: [31, 32, 33, 34], isCurrent: false },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusConfig(status: SupportUser["status"]) {
  switch (status) {
    case "complet":   return { label: "Complet",   cls: "bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/40 dark:text-green-300" }
    case "incomplet": return { label: "Incomplet", cls: "bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/40 dark:text-amber-300" }
    case "en_retard": return { label: "En retard", cls: "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/40 dark:text-red-300" }
  }
}

/** Retourne les données d'une semaine pour un user (simule "complet" si données archivées) */
function getWeekEntry(user: SupportUser, weekNumber: number, isCurrent: boolean): WeekEntry {
  const found = user.weeks.find(w => w.weekNumber === weekNumber)
  if (found) return found
  // Mois archivés → toujours complet dans la démo
  if (!isCurrent) return { weekNumber, hours: 35, target: 35, status: "complet" }
  return { weekNumber, hours: 0, target: 35, status: "incomplet" }
}

/** Statut d'une cellule semaine × user */
function cellStyle(entry: WeekEntry) {
  if (entry.status === "absent")   return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
  if (entry.status === "complet")  return "bg-green-100  text-green-700  dark:bg-green-900/30  dark:text-green-300"
  if (entry.hours === 0)           return "bg-red-100    text-red-600    dark:bg-red-900/30    dark:text-red-300"
  return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
}

function absenceTypeStyle(type: string) {
  switch (type) {
    case "conges_payes": return "bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/40 dark:text-blue-300"
    case "maladie":      return "bg-purple-100 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/40 dark:text-purple-300"
    case "rtt":          return "bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/40 dark:text-green-300"
    default:             return "bg-muted text-muted-foreground hover:bg-muted"
  }
}

function exportCSV(users: SupportUser[], label: string) {
  const rows = [
    ["Nom", "Role", "Departement", "Heures saisies", "Objectif", "Semaines completes", "Absences (j)", "Statut"],
    ...users.map(u => [
      u.name, u.role, u.department,
      u.totalHours, u.targetHours,
      `${u.weeksComplete}/${u.weeksTotal}`,
      u.absenceDays,
      statusConfig(u.status).label,
    ]),
  ]
  const csv = rows.map(r => r.join(",")).join("\n")
  const blob = new Blob([csv], { type: "text/csv" })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement("a")
  a.href = url
  a.download = `heures-${label.replace(/\s/g, "-").toLowerCase()}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Composant ────────────────────────────────────────────────────────────────

export function SupportView() {
  const [searchQuery,      setSearchQuery]      = useState("")
  const [filterStatus,     setFilterStatus]     = useState("all")
  const [filterDepartment, setFilterDepartment] = useState("all")
  const [isFilterOpen,     setIsFilterOpen]     = useState(false)
  const [activeTab,        setActiveTab]        = useState<"mensuel" | "collaborateurs">("mensuel")
  const [selectedUser,     setSelectedUser]     = useState<SupportUser | null>(null)
  const [isDetailOpen,     setIsDetailOpen]     = useState(false)
  const [sheetView,        setSheetView]        = useState<"weekly" | "profile">("weekly")
  const [expandedMonthId,  setExpandedMonthId]  = useState<string | null>("2026-10")
  const [expandedAbsences, setExpandedAbsences] = useState<Set<number>>(new Set())
  const [expandedWeeks,    setExpandedWeeks]    = useState<Set<number>>(new Set())
  const [expandedDays,     setExpandedDays]     = useState<Set<string>>(new Set())

  const toggleAbsence = (i: number) =>
    setExpandedAbsences(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n })

  const toggleWeek = (wn: number) =>
    setExpandedWeeks(prev => { const n = new Set(prev); n.has(wn) ? n.delete(wn) : n.add(wn); return n })

  const toggleDay = (key: string) =>
    setExpandedDays(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n })

  const handleOpenDetail = (user: SupportUser, view: "weekly" | "profile" = "weekly") => {
    setSelectedUser(user)
    setSheetView(view)
    setIsDetailOpen(true)
    setExpandedAbsences(new Set())
    setExpandedWeeks(new Set())
    setExpandedDays(new Set())
  }

  // Navigation vers l'autre onglet pour le même utilisateur
  const switchTab = (tab: "mensuel" | "collaborateurs", view: "weekly" | "profile") => {
    setActiveTab(tab)
    setSheetView(view)
    setExpandedWeeks(new Set())
    setExpandedDays(new Set())
  }

  // Génère les heures par jour à partir des heures totales de la semaine (mock)
  const DAY_NAMES = ["Lun", "Mar", "Mer", "Jeu", "Ven"] as const
  type DayName = typeof DAY_NAMES[number]
  function getSimulatedDays(week: { hours: number; target: number; status: string }): { day: DayName; hours: number; absent: boolean }[] {
    if (week.status === "absent") return DAY_NAMES.map(d => ({ day: d, hours: 7, absent: true }))
    let rem = week.hours
    return DAY_NAMES.map(d => {
      if (rem >= 7) { rem -= 7; return { day: d, hours: 7, absent: false } }
      const h = rem; rem = 0; return { day: d, hours: h, absent: false }
    })
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

  // Stats globales (tous les users, pas seulement filtrés)
  const totalUsers    = mockUsers.length
  const completeCount = mockUsers.filter(u => u.status === "complet").length
  const lateCount     = mockUsers.filter(u => u.status === "en_retard").length
  const totalHours    = mockUsers.reduce((s, u) => s + u.totalHours, 0)
  const targetHours   = mockUsers.reduce((s, u) => s + u.targetHours, 0)


  const toggleMonth = (id: string) =>
    setExpandedMonthId(prev => prev === id ? null : id)

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Support</h1>
          <p className="text-sm text-muted-foreground">Suivi et export des heures par collaborateur</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-2"
          onClick={() => exportCSV(mockUsers, "octobre-2026")}
        >
          <FileSpreadsheet className="w-4 h-4" />
          Export global CSV
        </Button>
      </div>

      {/* Stats — carte unique avec hover détail */}
      <InfoCardPopover
        variant="stats"
        trigger="hover"
        title="Vue d'ensemble"
        subtitle="Octobre 2026"
        theme="default"
        side="bottom"
        align="start"
        width="w-80"
        stats={[
          { label: "Collaborateurs",     value: `${totalUsers}` },
          { label: "Heures saisies",     value: `${totalHours}h / ${targetHours}h` },
          { label: "Taux de complétion", value: `${Math.round((completeCount / totalUsers) * 100)}%`, subtle: true },
          { label: "Complets",           value: `${completeCount} / ${totalUsers}` },
          { label: "En retard",          value: `${lateCount}`, subtle: lateCount === 0 },
          { label: "Incomplets",         value: `${totalUsers - completeCount - lateCount}`, subtle: true },
        ]}
      >
        <Card className="border border-border cursor-default hover:shadow-md transition-shadow group">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-foreground">Vue d'ensemble</span>
              <Users className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Collaborateurs</p>
                <span className="text-xl font-bold text-foreground">{totalUsers}</span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Complets</p>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-xl font-bold text-green-600 dark:text-green-400">{completeCount}</span>
                  <span className="text-xs text-muted-foreground">/{totalUsers}</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">En retard</p>
                <span className={`text-xl font-bold ${lateCount > 0 ? "text-red-600 dark:text-red-400" : "text-foreground"}`}>
                  {lateCount}
                </span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Heures</p>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-xl font-bold text-foreground">{totalHours}</span>
                  <span className="text-xs text-muted-foreground">h</span>
                </div>
                <Progress value={(totalHours / targetHours) * 100} className="h-1 mt-1.5 bg-muted [&>div]:bg-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </InfoCardPopover>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={v => setActiveTab(v as "mensuel" | "collaborateurs")} className="w-full">
        <TabsList>
          <TabsTrigger value="mensuel">Vue mensuelle</TabsTrigger>
          <TabsTrigger value="collaborateurs">Par collaborateur</TabsTrigger>
        </TabsList>

        {/* ── Onglet collaborateurs ───────────────────────────────────── */}
        <TabsContent value="collaborateurs" className="mt-4 space-y-4">
          {/* Filtres */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
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
                  Filtres
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
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Statut</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { value: "all",       label: "Tous" },
                        { value: "complet",   label: "Complets" },
                        { value: "incomplet", label: "Incomplets" },
                        { value: "en_retard", label: "En retard" },
                      ].map(opt => (
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
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Département</label>
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
                          {dept === "all" ? "Tous les départements" : dept}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="px-4 py-3 border-t border-border bg-muted/30">
                  <Button className="w-full h-9" size="sm" onClick={() => setIsFilterOpen(false)}>
                    Appliquer
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            {/* Active filter chips */}
            {hasActiveFilter && (
              <div className="flex items-center gap-1.5">
                {filterStatus !== "all" && (
                  <Badge variant="secondary" className="gap-1 pr-1 text-xs">
                    {filterStatus === "complet" ? "Complets" : filterStatus === "incomplet" ? "Incomplets" : "En retard"}
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
            <div className="grid grid-cols-[1fr_80px_120px_110px_100px_32px_32px] items-center px-4 py-2 bg-muted/40 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <span>Collaborateur</span>
              <span className="text-center">Projets</span>
              <span className="text-center">Congés</span>
              <span className="text-center">Heures/mois</span>
              <span className="text-center">Statut</span>
              <span />
              <span />
            </div>

            <div className="divide-y divide-border">
              {filtered.map(user => {
                const sc       = statusConfig(user.status)
                const progress = (user.totalHours / user.targetHours) * 100

                const weekStats: StatRow[] = user.weeks.map(w => ({
                  label: `S${w.weekNumber}`,
                  value: `${w.hours}h / ${w.target}h`,
                  subtle: w.status === "absent",
                }))

                const congesStats: StatRow[] = [
                  { label: "CP utilisés",        value: `${user.congesUsed}j / ${user.congesTotal}j` },
                  { label: "CP restants",         value: `${user.congesTotal - user.congesUsed}j`   },
                  { label: "TT utilisés",         value: `${user.ttUsed}j / ${user.ttTotal}j`        },
                  { label: "TT restants",         value: `${user.ttTotal - user.ttUsed}j`, subtle: true },
                  { label: "Absences & maladie",  value: `${user.absenceDays}j`, subtle: true         },
                ]

                return (
                  <div
                    key={user.id}
                    className="grid grid-cols-[1fr_80px_120px_110px_100px_32px_32px] items-center px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer group"
                    onClick={() => handleOpenDetail(user, "profile")}
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
                    <div className="flex justify-center">
                      <Badge variant="outline" className="text-xs font-normal gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
                        {user.activeProjects}
                      </Badge>
                    </div>

                    {/* Congés (CP + TT) avec hover détail */}
                    <div className="flex justify-center">
                      <InfoCardPopover
                        variant="stats"
                        trigger="hover"
                        title={user.name}
                        subtitle="Soldes & absences"
                        theme="default"
                        side="right"
                        align="start"
                        width="w-56"
                        stats={congesStats}
                        triggerClassName="inline-flex"
                      >
                        <div className="flex items-center gap-1 cursor-default">
                          <Badge variant="outline" className="text-xs font-normal text-violet-600 border-violet-300 dark:text-violet-400 dark:border-violet-700">
                            CP {user.congesTotal - user.congesUsed}j
                          </Badge>
                          <Badge variant="outline" className="text-xs font-normal text-sky-600 border-sky-300 dark:text-sky-400 dark:border-sky-700">
                            TT {user.ttTotal - user.ttUsed}j
                          </Badge>
                        </div>
                      </InfoCardPopover>
                    </div>

                    {/* Heures ce mois */}
                    <div className="px-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-foreground">{user.totalHours}h</span>
                        <span className="text-xs text-muted-foreground">{user.targetHours}h</span>
                      </div>
                      <Progress
                        value={progress}
                        className={`h-1 bg-muted ${
                          user.status === "en_retard" ? "[&>div]:bg-red-500" : "[&>div]:bg-blue-500"
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
                          <DropdownMenuItem onClick={() => exportCSV([user], user.name)}>
                            <Download className="w-4 h-4 mr-2" />
                            Exporter CSV
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleOpenDetail(user, "profile")}>
                            <ChevronRight className="w-4 h-4 mr-2" />
                            Voir le détail
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                )
              })}

              {filtered.length === 0 && (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  Aucun collaborateur ne correspond aux filtres
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ── Onglet vue mensuelle ────────────────────────────────────── */}
        <TabsContent value="mensuel" className="mt-4 space-y-3">
          {MONTH_PERIODS.map(month => {
            const isExpanded = expandedMonthId === month.id

            // Calcul du statut du mois à partir des données réelles (ou simulées)
            const monthCompletions = mockUsers.map(user => {
              const entries = month.weekNumbers.map(wn => getWeekEntry(user, wn, month.isCurrent))
              const allDone = entries.every(e => e.status === "complet")
              return allDone
            })
            const completeUsers  = monthCompletions.filter(Boolean).length
            const allComplete    = completeUsers === mockUsers.length
            const monthStatus    = !month.isCurrent ? "archive" : allComplete ? "complet" : "en_cours"

            return (
              <div key={month.id} className="border border-border rounded-lg overflow-hidden">
                {/* En-tête du mois */}
                <button
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
                  onClick={() => toggleMonth(month.id)}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold text-foreground">{month.label}</span>
                    <Badge
                      className={`text-xs font-normal ${
                        monthStatus === "archive"  ? "bg-muted text-muted-foreground hover:bg-muted"                              :
                        monthStatus === "complet"  ? "bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/40 dark:text-green-300" :
                                                     "bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/40 dark:text-amber-300"
                      }`}
                    >
                      {monthStatus === "archive" ? "Archivé" : monthStatus === "complet" ? "Complet" : "En cours"}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-xs text-muted-foreground">
                      {completeUsers}/{mockUsers.length} collaborateurs complets
                    </span>
                    {/* Barre de progression du mois */}
                    <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${monthStatus === "complet" ? "bg-green-500" : "bg-blue-500"}`}
                        style={{ width: `${(completeUsers / mockUsers.length) * 100}%` }}
                      />
                    </div>
                    {/* Bouton export */}
                    <div onClick={e => e.stopPropagation()}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2.5 gap-1.5 text-xs"
                        onClick={() => exportCSV(mockUsers, month.label)}
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        Export
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
                          <th className="text-left px-4 py-2 font-medium text-muted-foreground w-44">
                            Collaborateur
                          </th>
                          {month.weekNumbers.map(wn => (
                            <th key={wn} className="text-center px-3 py-2 font-medium text-muted-foreground w-24">
                              S{wn}
                            </th>
                          ))}
                          <th className="text-center px-3 py-2 font-medium text-muted-foreground w-24">
                            Total
                          </th>
                          <th className="text-center px-3 py-2 font-medium text-muted-foreground w-24">
                            Statut
                          </th>
                          <th className="w-8" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {mockUsers.map(user => {
                          const entries     = month.weekNumbers.map(wn => getWeekEntry(user, wn, month.isCurrent))
                          const monthTotal  = entries.reduce((s, e) => s + e.hours, 0)
                          const monthTarget = month.weekNumbers.length * 35
                          const allDone     = entries.every(e => e.status === "complet")
                          const sc          = allDone ? statusConfig("complet") : statusConfig(user.status)

                          return (
                            <tr
                              key={user.id}
                              className="hover:bg-muted/30 transition-colors cursor-pointer group"
                              onClick={() => handleOpenDetail(user, "weekly")}
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

                              {/* Cellules semaines */}
                              {entries.map(entry => (
                                <td key={entry.weekNumber} className="px-3 py-2.5 text-center">
                                  <span className={`inline-flex items-center justify-center w-16 rounded px-2 py-1 font-medium text-[11px] ${cellStyle(entry)}`}>
                                    {entry.status === "absent" ? "Absence" : `${entry.hours}h`}
                                  </span>
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
                              <td className="pr-3 py-2.5">
                                <ChevronRight className="w-4 h-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>

                    {/* Légende */}
                    <div className="flex items-center gap-4 px-4 py-3 border-t border-border bg-muted/20">
                      <span className="text-xs text-muted-foreground font-medium">Légende :</span>
                      {[
                        { cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300", label: "Complet (35h)" },
                        { cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300", label: "Partiel" },
                        { cls: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300",         label: "Non saisi" },
                        { cls: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300", label: "Absence" },
                      ].map(item => (
                        <span key={item.label} className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ${item.cls}`}>
                          {item.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </TabsContent>
      </Tabs>

      {/* Detail Sheet */}
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto p-0">
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-border">
            <SheetHeader className="mb-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="text-sm bg-muted">{selectedUser?.initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <SheetTitle className="text-lg font-bold">{selectedUser?.name}</SheetTitle>
                  <SheetDescription>{selectedUser?.role} · {selectedUser?.department}</SheetDescription>
                </div>
              </div>
            </SheetHeader>

            {/* Tabs vue + bouton export au même niveau */}
            <div className="flex items-center justify-between gap-3">
              <Tabs value={sheetView} onValueChange={v => setSheetView(v as "weekly" | "profile")}>
                <TabsList>
                  <TabsTrigger value="weekly">Semaines</TabsTrigger>
                  <TabsTrigger value="profile">Profil</TabsTrigger>
                </TabsList>
              </Tabs>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 flex-shrink-0"
                onClick={() => selectedUser && exportCSV([selectedUser], selectedUser.name)}
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="p-6 space-y-6">

            {/* ── VUE SEMAINES ─────────────────────────────────────────────── */}
            {sheetView === "weekly" && (
              <>
                {/* Résumé heures */}
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Octobre 2026</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-foreground">{selectedUser?.totalHours}h</span>
                      <span className="text-sm text-muted-foreground">/ {selectedUser?.targetHours}h</span>
                    </div>
                    <Progress
                      value={Math.min(((selectedUser?.totalHours ?? 0) / (selectedUser?.targetHours ?? 1)) * 100, 100)}
                      className="h-1.5 w-40 mt-2 bg-muted [&>div]:bg-blue-500"
                    />
                  </div>
                  {selectedUser && (
                    <Badge className={`text-xs font-normal ${statusConfig(selectedUser.status).cls}`}>
                      {statusConfig(selectedUser.status).label}
                    </Badge>
                  )}
                </div>

                {/* Accordion semaines → jours → projets */}
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Détail par semaine</p>
                  <div className="border border-border rounded-lg overflow-hidden divide-y divide-border">
                    {selectedUser?.weeks.map(week => {
                      const isExpanded = expandedWeeks.has(week.weekNumber)
                      const days       = getSimulatedDays(week)
                      const wCls       = week.status === "absent"  ? "bg-orange-100 text-orange-700 hover:bg-orange-100 dark:bg-orange-900/40 dark:text-orange-300"
                                       : week.status === "complet" ? "bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/40 dark:text-green-300"
                                       : "bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/40 dark:text-amber-300"
                      return (
                        <div key={week.weekNumber}>
                          {/* Ligne semaine — cliquable */}
                          <button
                            className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors text-left"
                            onClick={() => toggleWeek(week.weekNumber)}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-semibold text-foreground w-7">S{week.weekNumber}</span>
                              <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${week.status === "absent" ? "bg-orange-400" : week.status === "complet" ? "bg-green-500" : "bg-amber-500"}`}
                                  style={{ width: `${Math.min((week.hours / week.target) * 100, 100)}%` }}
                                />
                              </div>
                              <span className="text-sm text-foreground">{week.hours}h</span>
                              <span className="text-xs text-muted-foreground">/ {week.target}h</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={`text-xs font-normal ${wCls}`}>
                                {week.status === "absent" ? "Absence" : week.status}
                              </Badge>
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />}
                            </div>
                          </button>

                          {/* Jours (niveau 2) */}
                          {isExpanded && (
                            <div className="border-t border-border bg-muted/10 divide-y divide-border/60">
                              {days.map(d => {
                                const dayKey     = `${week.weekNumber}-${d.day}`
                                const isDayOpen  = expandedDays.has(dayKey)
                                const projects   = d.hours > 0 && selectedUser?.projectNames
                                  ? [selectedUser.projectNames[DAY_NAMES.indexOf(d.day) % selectedUser.projectNames.length]]
                                  : []

                                return (
                                  <div key={d.day}>
                                    {/* Ligne jour — cliquable si heures > 0 */}
                                    <button
                                      className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors ${d.hours > 0 && !d.absent ? "hover:bg-muted/30 cursor-pointer" : "cursor-default"}`}
                                      onClick={() => d.hours > 0 && !d.absent && toggleDay(dayKey)}
                                      disabled={d.hours === 0 || d.absent}
                                    >
                                      <div className="flex items-center gap-3">
                                        <span className="text-xs font-medium text-muted-foreground w-8">{d.day}</span>
                                        {d.absent ? (
                                          <Badge className="text-xs font-normal bg-orange-100 text-orange-700 hover:bg-orange-100 dark:bg-orange-900/40 dark:text-orange-300">Absence</Badge>
                                        ) : (
                                          <div className="flex items-center gap-2">
                                            <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
                                              <div className={`h-full rounded-full ${d.hours >= 7 ? "bg-green-500" : d.hours > 0 ? "bg-amber-500" : "bg-muted-foreground/20"}`}
                                                style={{ width: `${(d.hours / 7) * 100}%` }} />
                                            </div>
                                            <span className={`text-xs font-medium ${d.hours >= 7 ? "text-green-600 dark:text-green-400" : d.hours > 0 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground/40"}`}>
                                              {d.hours > 0 ? `${d.hours}h` : "—"}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                      {d.hours > 0 && !d.absent && (
                                        isDayOpen ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />
                                      )}
                                    </button>

                                    {/* Projets (niveau 3) */}
                                    {isDayOpen && projects.length > 0 && (
                                      <div className="bg-muted/20 border-t border-border/60 px-4 py-2 space-y-1.5">
                                        {projects.map((projName, pi) => (
                                          <div key={pi} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                              <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: PROJECT_COLORS[pi % PROJECT_COLORS.length] }} />
                                              <span className="text-xs text-foreground">{projName}</span>
                                            </div>
                                            <span className="text-xs text-muted-foreground">{d.hours}h</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
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
                  onClick={() => switchTab("collaborateurs", "profile")}
                  className="w-full flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                  Voir le profil complet de {selectedUser?.name.split(" ")[0]}
                </button>
              </>
            )}

            {/* ── VUE PROFIL ───────────────────────────────────────────────── */}
            {sheetView === "profile" && (
              <>
                {/* Grosse card Projets + Congés + TT avec hover détail */}
                <InfoCardPopover
                  variant="stats"
                  trigger="hover"
                  title={selectedUser?.name ?? ""}
                  subtitle="Projets & soldes"
                  theme="default"
                  side="left"
                  align="start"
                  width="w-72"
                  stats={[
                    { label: "Projets actifs", value: `${selectedUser?.activeProjects ?? 0}` },
                    ...(selectedUser?.projectNames?.map(p => ({ label: `↳ ${p}`, value: "en cours", subtle: true })) ?? []),
                    { label: "CP utilisés",    value: `${selectedUser?.congesUsed ?? 0}j / ${selectedUser?.congesTotal ?? 0}j` },
                    { label: "CP restants",    value: `${(selectedUser?.congesTotal ?? 0) - (selectedUser?.congesUsed ?? 0)}j` },
                    { label: "TT utilisés",    value: `${selectedUser?.ttUsed ?? 0}j / ${selectedUser?.ttTotal ?? 0}j` },
                    { label: "TT restants",    value: `${(selectedUser?.ttTotal ?? 0) - (selectedUser?.ttUsed ?? 0)}j`, subtle: true },
                    { label: "Absences",       value: `${selectedUser?.absenceDays ?? 0}j`, subtle: true },
                  ]}
                >
                  <Card className="border border-border cursor-default hover:shadow-md transition-shadow group">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-foreground">Ressources & soldes</span>
                        <Users className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5">Projets actifs</p>
                          <div className="flex items-baseline gap-1">
                            <span className="text-xl font-bold text-foreground">{selectedUser?.activeProjects ?? 0}</span>
                            <span className="text-xs text-muted-foreground">en cours</span>
                          </div>
                          <div className="mt-1 space-y-0.5">
                            {selectedUser?.projectNames?.slice(0, 2).map((p, i) => (
                              <div key={i} className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-sm" style={{ backgroundColor: PROJECT_COLORS[i] }} />
                                <span className="text-xs text-muted-foreground truncate max-w-[90px]">{p}</span>
                              </div>
                            ))}
                            {(selectedUser?.projectNames?.length ?? 0) > 2 && (
                              <span className="text-xs text-muted-foreground">+{(selectedUser?.projectNames?.length ?? 0) - 2} autres</span>
                            )}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <p className="text-xs text-muted-foreground mb-0.5">CP restants</p>
                            <div className="flex items-baseline gap-0.5">
                              <span className="text-xl font-bold text-violet-600 dark:text-violet-400">
                                {(selectedUser?.congesTotal ?? 0) - (selectedUser?.congesUsed ?? 0)}
                              </span>
                              <span className="text-xs text-muted-foreground">/ {selectedUser?.congesTotal ?? 0}j</span>
                            </div>
                            <Progress value={((selectedUser?.congesUsed ?? 0) / (selectedUser?.congesTotal ?? 1)) * 100} className="h-1 mt-1 bg-muted [&>div]:bg-violet-500" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-0.5">TT restants</p>
                            <div className="flex items-baseline gap-0.5">
                              <span className="text-xl font-bold text-sky-600 dark:text-sky-400">
                                {(selectedUser?.ttTotal ?? 0) - (selectedUser?.ttUsed ?? 0)}
                              </span>
                              <span className="text-xs text-muted-foreground">/ {selectedUser?.ttTotal ?? 0}j</span>
                            </div>
                            <Progress value={((selectedUser?.ttUsed ?? 0) / (selectedUser?.ttTotal ?? 1)) * 100} className="h-1 mt-1 bg-muted [&>div]:bg-sky-500" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </InfoCardPopover>

                {/* Congés & absences avec calendrier accordion */}
                {(selectedUser?.absencePeriods?.length ?? 0) > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Palmtree className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">Congés & absences</span>
                      </div>
                      {selectedUser?.absencePeriods?.map((period, i) => {
                        const isOpen  = expandedAbsences.has(i)
                        const weekNum = getISOWeek(period.from)
                        return (
                          <div key={i} className="rounded-lg border border-border">
                            <button
                              className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors text-left"
                              onClick={() => toggleAbsence(i)}
                            >
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="outline" className={`text-xs font-normal ${absenceTypeStyle(period.type)}`}>{period.label}</Badge>
                                <span className="text-xs text-muted-foreground">{period.days} jour{period.days > 1 ? "s" : ""}</span>
                                <span className="text-xs text-muted-foreground">·</span>
                                <span className="text-xs font-medium text-foreground">S{weekNum}</span>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  {format(period.from, "d MMM", { locale: fr })} → {format(period.to, "d MMM", { locale: fr })}
                                </span>
                                {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />}
                              </div>
                            </button>
                            {isOpen && (
                              <div className="border-t border-border pointer-events-none select-none flex justify-center py-3 bg-muted/20">
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
                      })}
                    </div>
                  </>
                )}

              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
