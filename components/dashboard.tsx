"use client"

import { useAuth } from "@/contexts/auth-context"
import { useTimesheet } from "@/contexts/timesheet-context"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Clock, Calendar, CalendarDays, Palmtree, CalendarCheck, FolderOpen, ChevronRight, BarChart3, CheckCircle2, AlertCircle } from "lucide-react"

interface DashboardProps {
  onNavigate: (view: string, openPanel?: boolean) => void
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { user } = useAuth()
  const { weeks, absences, getTotalHoursThisMonth, getCompletedWeeksCount, getPendingAbsencesCount, getCongesBalance } = useTimesheet()

  const hoursThisMonth = getTotalHoursThisMonth()
  const targetMonthlyHours = 140
  const monthProgress = Math.min((hoursThisMonth / targetMonthlyHours) * 100, 100)
  const completedWeeks = getCompletedWeeksCount()
  const pendingAbsences = getPendingAbsencesCount()
  const congesBalance = getCongesBalance()

  // Weekly data for the progress bars
  const weeklyData = [
    { week: "s38", hours: 35, target: 35, status: "complet" },
    { week: "s39", hours: 35, target: 35, status: "complet" },
    { week: "s40", hours: 30, target: 35, status: "incomplet" },
    { week: "s41", hours: 28, target: 35, status: "incomplet" },
  ]

  // Project distribution
  const projectDistribution = [
    { name: "Projet Alpha", hours: 45, percentage: 38, color: "#f97316" },
    { name: "Projet Beta", hours: 33, percentage: 27, color: "#3b82f6" },
    { name: "Support Client", hours: 28, percentage: 23, color: "#eab308" },
    { name: "Formation", hours: 15, percentage: 13, color: "#d1d5db" },
  ]

  const pendingAbsencesList = absences.filter((a) => a.status === "en_attente")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Bonjour, {user?.name?.split(" ")[0] || "nom"}</h1>
        <p className="text-muted-foreground text-sm">Apercu de votre activite ce mois-ci</p>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Heures ce mois */}
        <Card className="border border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Heures ce mois</span>
              <Clock className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-foreground">{hoursThisMonth}</span>
                <span className="text-sm text-muted-foreground">/{targetMonthlyHours}h</span>
              </div>
              <Progress value={monthProgress} className="h-1.5 bg-muted" />
              <p className="text-xs text-muted-foreground">{Math.round(monthProgress)}% de l&apos;objectif</p>
            </div>
          </CardContent>
        </Card>

        {/* Semaines completes */}
        <Card className="border border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Semaines completes</span>
              <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-foreground">{completedWeeks}</span>
                <span className="text-sm text-muted-foreground">/4</span>
              </div>
              <div className="flex gap-1">
                <div className="h-1.5 flex-1 bg-green-500 rounded-full" />
                <div className="h-1.5 flex-1 bg-green-500 rounded-full" />
                <div className="h-1.5 flex-1 bg-red-500 rounded-full" />
                <div className="h-1.5 flex-1 bg-muted rounded-full" />
              </div>
              <p className="text-xs text-muted-foreground">Semaine en cours : S41</p>
            </div>
          </CardContent>
        </Card>

        {/* Demandes en attente */}
        <Card className="border border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Demandes en attente</span>
              <AlertCircle className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-foreground">{pendingAbsences}</span>
              </div>
              <Badge className="bg-pink-100 text-pink-700 hover:bg-pink-100 dark:bg-pink-900/40 dark:text-pink-300 font-normal text-xs">
                1 approuvee
              </Badge>
              <p className="text-xs text-muted-foreground">En attente de validation</p>
            </div>
          </CardContent>
        </Card>

        {/* Solde conges */}
        <Card className="border border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Solde conges</span>
              <Palmtree className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-foreground">{25 - congesBalance.used}j</span>
                <span className="text-sm text-muted-foreground">/{congesBalance.total}</span>
              </div>
              <Progress value={((25 - congesBalance.used) / 25) * 100} className="h-1.5 bg-muted [&>div]:bg-yellow-400" />
              <p className="text-xs text-muted-foreground">{congesBalance.used} utilises</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Middle Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Apercu hebdomadaire */}
        <Card 
          className="border border-border cursor-pointer hover:border-primary/50 hover:shadow-sm transition-all group"
          onClick={() => onNavigate("pointage")}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-foreground">Apercu hebdomadaire</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
            </div>
            <div className="space-y-3">
              {weeklyData.map((week) => {
                const percentage = (week.hours / week.target) * 100
                return (
                  <div key={week.week} className="flex items-center gap-3">
                    <span className="text-sm font-medium text-foreground w-8">{week.week}</span>
                    <span className="text-xs text-muted-foreground w-16">{week.hours}h / {week.target}h</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          week.status === "complet" ? "bg-green-500" : "bg-amber-500"
                        }`}
                        style={{ width: `${Math.min(percentage, 100)}%` }} 
                      />
                    </div>
                    <Badge 
                      className={`text-xs font-normal ${
                        week.status === "complet" 
                          ? "bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/40 dark:text-green-300" 
                          : "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/40 dark:text-red-300"
                      }`}
                    >
                      {week.status}
                    </Badge>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Demandes en attente */}
        <Card 
          className="border border-border cursor-pointer hover:border-primary/50 hover:shadow-sm transition-all group"
          onClick={() => onNavigate("absence")}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-foreground">Demandes en attente</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
            </div>
            {pendingAbsencesList.length > 0 ? (
              <div className="space-y-3">
                {pendingAbsencesList.map((absence) => (
                  <div key={absence.id} className="p-3 border border-border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">{absence.typeLabel}</p>
                        <p className="text-xs text-muted-foreground">{absence.startDate} - {absence.endDate}</p>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 dark:bg-yellow-900/40 dark:text-yellow-300 font-normal text-xs">
                        en attente
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>{absence.duration} jours</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Aucune demande en attente</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Repartition par projet */}
        <Card className="border border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-foreground">Repartition par projet</span>
              <BarChart3 className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="space-y-3">
              {projectDistribution.map((project) => (
                <div key={project.name} className="flex items-center gap-3">
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: project.color }}
                  />
                  <span className="text-sm text-foreground flex-1">{project.name}</span>
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full" 
                      style={{ width: `${project.percentage}%`, backgroundColor: project.color }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-20 text-right">{project.hours}h ({project.percentage}%)</span>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-sm font-medium text-foreground">Total</span>
                <span className="text-sm font-medium text-foreground">120h</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions rapides */}
        <Card className="border border-border">
          <CardContent className="p-4">
            <span className="text-sm font-medium text-foreground">Actions rapides</span>
            <div className="space-y-2 mt-4">
              <button 
                onClick={() => onNavigate("pointage", true)}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
              >
                <Clock className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm text-foreground">Saisir mes heures</span>
              </button>
              <button 
                onClick={() => onNavigate("absence", true)}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
              >
                <CalendarCheck className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm text-foreground">Demander un conge</span>
              </button>
              <button 
                onClick={() => onNavigate("projects")}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
              >
                <FolderOpen className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm text-foreground">Voir mes projets</span>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
