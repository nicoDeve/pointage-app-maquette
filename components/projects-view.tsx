"use client"

import { useTimesheet } from "@/contexts/timesheet-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

export function ProjectsView() {
  const { projects, weeks } = useTimesheet()

  const getProjectHours = (projectId: string) => {
    let total = 0
    weeks.forEach((week) => {
      week.entries.forEach((entry) => {
        if (entry.projectId === projectId) {
          total += entry.hours
        }
      })
    })
    return total
  }

  const totalHours = weeks.reduce((sum, week) => sum + week.totalHours, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Mes Projets</h1>
        <p className="text-muted-foreground mt-1">Repartition du temps par projet</p>
      </div>

      {/* Summary Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-muted-foreground">Total des heures</span>
            <span className="text-2xl font-semibold text-foreground">{totalHours}h</span>
          </div>
          <div className="flex h-4 rounded-full overflow-hidden bg-muted">
            {projects.map((project) => {
              const hours = getProjectHours(project.id)
              const percentage = totalHours > 0 ? (hours / totalHours) * 100 : 0
              if (percentage === 0) return null
              return (
                <div
                  key={project.id}
                  className="h-full transition-all"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: project.color,
                  }}
                />
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Project List */}
      <div className="space-y-3">
        {projects.map((project) => {
          const hours = getProjectHours(project.id)
          const percentage = totalHours > 0 ? (hours / totalHours) * 100 : 0

          return (
            <Card key={project.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: project.color }}
                    />
                    <h3 className="font-medium text-foreground">{project.name}</h3>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-foreground">{hours}h</span>
                    <span className="text-sm text-muted-foreground ml-2">({percentage.toFixed(0)}%)</span>
                  </div>
                </div>
                <div className="h-2 rounded-full overflow-hidden bg-muted">
                  <div
                    className="h-full transition-all rounded-full"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: project.color,
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
