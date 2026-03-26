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
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Palmtree,
  MoreHorizontal,
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
  const [searchQuery,    setSearchQuery]    = useState("")
  const [filterStatus,   setFilterStatus]   = useState("all")
  const [selectedUser,   setSelectedUser]   = useState<SupportUser | null>(null)
  const [isDetailOpen,   setIsDetailOpen]   = useState(false)
  const [expandedMonthId,    setExpandedMonthId]    = useState<string | null>("2026-10")
  const [expandedAbsences,   setExpandedAbsences]   = useState<Set<number>>(new Set())

  const toggleAbsence = (i: number) =>
    setExpandedAbsences(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })

  const filtered = mockUsers.filter(u => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (!u.name.toLowerCase().includes(q) && !u.role.toLowerCase().includes(q) && !u.department.toLowerCase().includes(q)) return false
    }
    if (filterStatus !== "all" && u.status !== filterStatus) return false
    return true
  })

  // Stats globales (tous les users, pas seulement filtrés)
  const totalUsers    = mockUsers.length
  const completeCount = mockUsers.filter(u => u.status === "complet").length
  const lateCount     = mockUsers.filter(u => u.status === "en_retard").length
  const totalHours    = mockUsers.reduce((s, u) => s + u.totalHours, 0)
  const targetHours   = mockUsers.reduce((s, u) => s + u.targetHours, 0)

  const handleOpenDetail = (user: SupportUser) => {
    setSelectedUser(user)
    setIsDetailOpen(true)
    setExpandedAbsences(new Set())
  }

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

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Collaborateurs</span>
              <Users className="w-4 h-4 text-muted-foreground" />
            </div>
            <span className="text-3xl font-bold text-foreground">{totalUsers}</span>
          </CardContent>
        </Card>

        <Card className="border border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Heures saisies</span>
              <Clock className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-foreground">{totalHours}</span>
              <span className="text-sm text-muted-foreground">/{targetHours}h</span>
            </div>
            <Progress value={(totalHours / targetHours) * 100} className="h-1.5 mt-2 bg-muted [&>div]:bg-blue-500" />
          </CardContent>
        </Card>

        <Card className="border border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Complets</span>
              <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-foreground">{completeCount}</span>
              <span className="text-sm text-muted-foreground">/{totalUsers}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">En retard</span>
              <AlertTriangle className="w-4 h-4 text-muted-foreground" />
            </div>
            <span className={`text-3xl font-bold ${lateCount > 0 ? "text-red-600 dark:text-red-400" : "text-foreground"}`}>
              {lateCount}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="mensuel" className="w-full">
        <TabsList className="bg-muted p-1 rounded-lg">
          <TabsTrigger value="mensuel" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Vue mensuelle
          </TabsTrigger>
          <TabsTrigger value="collaborateurs" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Par collaborateur
          </TabsTrigger>
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
            <div className="flex gap-1.5">
              {[
                { value: "all",       label: "Tous" },
                { value: "complet",   label: "Complets" },
                { value: "incomplet", label: "Incomplets" },
                { value: "en_retard", label: "En retard" },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setFilterStatus(opt.value)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    filterStatus === opt.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Liste */}
          <div className="border border-border rounded-lg overflow-hidden">
            {/* En-têtes */}
            <div className="grid grid-cols-[1fr_120px_120px_100px_100px_32px_32px] items-center px-4 py-2 bg-muted/40 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <span>Collaborateur</span>
              <span className="text-center">Heures</span>
              <span className="text-center">Semaines</span>
              <span className="text-center">Absences</span>
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

                return (
                  <div
                    key={user.id}
                    className="grid grid-cols-[1fr_120px_120px_100px_100px_32px_32px] items-center px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer group"
                    onClick={() => handleOpenDetail(user)}
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

                    {/* Heures */}
                    <div className="px-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-foreground">{user.totalHours}h</span>
                        <span className="text-xs text-muted-foreground">{user.targetHours}h</span>
                      </div>
                      <Progress
                        value={progress}
                        className={`h-1.5 bg-muted ${
                          user.status === "en_retard" ? "[&>div]:bg-red-500" : "[&>div]:bg-blue-500"
                        }`}
                      />
                    </div>

                    {/* Semaines */}
                    <div className="flex justify-center">
                      <InfoCardPopover
                        variant="stats"
                        trigger="hover"
                        title={user.name}
                        subtitle="Octobre 2026"
                        theme="default"
                        side="right"
                        align="start"
                        width="w-52"
                        stats={weekStats}
                        triggerClassName="inline-flex"
                      >
                        <Badge variant="outline" className="text-xs font-normal cursor-default">
                          {user.weeksComplete}/{user.weeksTotal} sem.
                        </Badge>
                      </InfoCardPopover>
                    </div>

                    {/* Absences */}
                    <div className="flex justify-center">
                      <Badge
                        variant="outline"
                        className={`text-xs font-normal ${
                          user.absenceDays > 0
                            ? "border-orange-300 text-orange-600 dark:border-orange-700 dark:text-orange-400"
                            : "border-border text-muted-foreground"
                        }`}
                      >
                        {user.absenceDays}j
                      </Badge>
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
                          <DropdownMenuItem onClick={() => handleOpenDetail(user)}>
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
                              onClick={() => handleOpenDetail(user)}
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
          <div className="p-6">
            <SheetHeader className="mb-6">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="text-sm bg-muted">{selectedUser?.initials}</AvatarFallback>
                </Avatar>
                <div>
                  <SheetTitle className="text-lg font-bold">{selectedUser?.name}</SheetTitle>
                  <SheetDescription>{selectedUser?.role} · {selectedUser?.department}</SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <div className="space-y-6">
              {/* Résumé */}
              <div className="space-y-3 p-4 border border-border rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Octobre 2026</span>
                  {selectedUser && (
                    <Badge className={`text-xs font-normal ${statusConfig(selectedUser.status).cls}`}>
                      {statusConfig(selectedUser.status).label}
                    </Badge>
                  )}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-foreground">{selectedUser?.totalHours}h</span>
                  <span className="text-sm text-muted-foreground">/ {selectedUser?.targetHours}h objectif</span>
                </div>
                <Progress
                  value={Math.min(((selectedUser?.totalHours ?? 0) / (selectedUser?.targetHours ?? 1)) * 100, 100)}
                  className="h-2 bg-muted [&>div]:bg-blue-500"
                />
              </div>

              <Separator />

              {/* Détail semaines */}
              <div className="space-y-2">
                <span className="text-sm font-medium text-foreground">Détail par semaine</span>
                <div className="divide-y divide-border border border-border rounded-lg overflow-hidden">
                  {selectedUser?.weeks.map(week => (
                    <div key={week.weekNumber} className="flex items-center justify-between px-4 py-2.5">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-foreground w-8">S{week.weekNumber}</span>
                        <div className="w-28 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              week.status === "absent"   ? "bg-orange-400" :
                              week.status === "complet"  ? "bg-green-500"  : "bg-amber-500"
                            }`}
                            style={{ width: `${Math.min((week.hours / week.target) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-foreground">{week.hours}h</span>
                        <span className="text-xs text-muted-foreground">/ {week.target}h</span>
                        <Badge
                          className={`text-xs font-normal w-20 justify-center ${
                            week.status === "absent"   ? "bg-orange-100 text-orange-700 hover:bg-orange-100 dark:bg-orange-900/40 dark:text-orange-300" :
                            week.status === "complet"  ? "bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/40 dark:text-green-300"      :
                                                         "bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/40 dark:text-amber-300"
                          }`}
                        >
                          {week.status === "absent" ? "Absence" : week.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

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
                      const isOpen         = expandedAbsences.has(i)
                      const spansTwoMonths = period.from.getMonth() !== period.to.getMonth()
                      const weekNum        = getISOWeek(period.from)

                      return (
                        <div key={i} className="rounded-lg border border-border overflow-hidden">
                          {/* En-tête cliquable */}
                          <button
                            className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors text-left"
                            onClick={() => toggleAbsence(i)}
                          >
                            <div className="flex items-center gap-2">
                              <Badge className={`text-xs font-normal ${absenceTypeStyle(period.type)}`}>
                                {period.label}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {period.days} jour{period.days > 1 ? "s" : ""}
                              </span>
                              <span className="text-xs text-muted-foreground">·</span>
                              <span className="text-xs font-medium text-foreground">
                                Semaine {weekNum}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                {format(period.from, "d MMM", { locale: fr })}
                                {" → "}
                                {format(period.to, "d MMM", { locale: fr })}
                              </span>
                              {isOpen
                                ? <ChevronUp   className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                                : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                              }
                            </div>
                          </button>

                          {/* Calendrier — s'expand vers le bas */}
                          {isOpen && (
                            <div className="border-t border-border pointer-events-none select-none flex justify-center py-2">
                              <Calendar
                                mode="range"
                                selected={{ from: period.from, to: period.to }}
                                defaultMonth={period.from}
                                numberOfMonths={spansTwoMonths ? 2 : 1}
                                showOutsideDays={false}
                                className="p-2"
                              />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </>
              )}

              <Separator />

              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => selectedUser && exportCSV([selectedUser], selectedUser.name)}
              >
                <Download className="w-4 h-4" />
                Exporter le rapport de {selectedUser?.name.split(" ")[0]}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
