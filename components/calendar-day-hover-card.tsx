"use client"

import * as React from "react"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { Badge } from "@/components/ui/badge"
import { Briefcase, Users, Palmtree, AlertTriangle, ChevronRight, Clock, CalendarDays } from "lucide-react"

export type CalendarDayEventItem = {
  type: "work" | "meeting" | "absence" | "deadline" | "holiday"
  label?: string
  hours?: number
  project?: string
}

type GradientTheme = "blue" | "orange" | "purple" | "red" | "default"

const gradientClasses: Record<GradientTheme, string> = {
  blue: "from-blue-50   to-blue-50/50   dark:from-blue-950/50   dark:to-blue-950/20",
  orange: "from-orange-50 to-orange-50/50 dark:from-orange-950/50 dark:to-orange-950/20",
  purple: "from-purple-50 to-purple-50/50 dark:from-purple-950/50 dark:to-purple-950/20",
  red: "from-red-50    to-red-50/50    dark:from-red-950/50    dark:to-red-950/20",
  default: "from-muted/80  to-muted/40",
}

const eventStyles: Record<CalendarDayEventItem["type"], { bg: string; text: string }> = {
  work: { bg: "bg-blue-100   dark:bg-blue-900/50", text: "text-blue-600   dark:text-blue-400" },
  meeting: { bg: "bg-purple-100 dark:bg-purple-900/50", text: "text-purple-600 dark:text-purple-400" },
  absence: { bg: "bg-red-100 dark:bg-red-900/50", text: "text-red-700 dark:text-red-300" },
  deadline: { bg: "bg-red-100    dark:bg-red-900/50", text: "text-red-600    dark:text-red-400" },
  holiday: { bg: "bg-slate-200 dark:bg-slate-800/80", text: "text-slate-700 dark:text-slate-200" },
}

const eventIcons: Record<CalendarDayEventItem["type"], React.ElementType> = {
  work: Briefcase,
  meeting: Users,
  absence: Palmtree,
  deadline: AlertTriangle,
  holiday: CalendarDays,
}

const eventTypeLabels: Record<CalendarDayEventItem["type"], string> = {
  work: "Travail",
  meeting: "Reunion",
  absence: "Absence",
  deadline: "Deadline",
  holiday: "Jour férié",
}

const eventTypeToTheme: Record<CalendarDayEventItem["type"], GradientTheme> = {
  work: "blue",
  meeting: "purple",
  absence: "red",
  deadline: "orange",
  holiday: "default",
}

export interface CalendarDayHoverCardProps {
  children: React.ReactNode
  title: string
  subtitle?: string
  badge?: string
  events: CalendarDayEventItem[]
  totalHours?: number
  side?: "top" | "bottom" | "left" | "right"
  align?: "start" | "center" | "end"
  width?: string
  triggerClassName?: string
  onEventClick?: (event: CalendarDayEventItem) => void
}

export function CalendarDayHoverCard({
  children,
  title,
  subtitle,
  badge,
  events,
  totalHours,
  side = "right",
  align = "start",
  width = "w-72",
  triggerClassName = "",
  onEventClick,
}: CalendarDayHoverCardProps) {
  if (events.length === 0) {
    return <div className={triggerClassName}>{children}</div>
  }

  const resolvedTheme: GradientTheme = events[0]?.type ? eventTypeToTheme[events[0].type] : "default"
  const contentClass = `${width} p-0 shadow-xl border border-border/50 overflow-hidden`

  return (
    <HoverCard openDelay={150} closeDelay={100}>
      <HoverCardTrigger asChild>
        <div className={triggerClassName}>{children}</div>
      </HoverCardTrigger>
      <HoverCardContent className={contentClass} side={side} align={align}>
        <div
          className={`px-4 py-3 bg-gradient-to-r ${gradientClasses[resolvedTheme]} border-b border-border/50`}
        >
          <div className="flex items-center justify-between">
            <p className="font-semibold text-sm text-foreground">{title}</p>
            {badge && (
              <Badge variant="outline" className="text-[10px] h-5 font-normal">
                {badge}
              </Badge>
            )}
          </div>
          {(subtitle || totalHours !== undefined) && (
            <div className="flex items-center gap-2 mt-1">
              {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
              {totalHours !== undefined && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {totalHours}h
                </span>
              )}
            </div>
          )}
        </div>

        <div className="p-2 space-y-1 max-h-64 overflow-y-auto">
          {events.map((event, idx) => {
            const Icon = eventIcons[event.type]
            const style = eventStyles[event.type]
            const isHoliday = event.type === "holiday"
            return (
              <div
                key={idx}
                className={`flex items-center gap-3 p-2 rounded-lg transition-all group ${
                  isHoliday ? "cursor-default opacity-95" : "cursor-pointer hover:bg-muted/80"
                }`}
                onClick={(e) => {
                  e.stopPropagation()
                  if (!isHoliday) onEventClick?.(event)
                }}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${style.bg} ${
                    isHoliday ? "" : "transition-transform group-hover:scale-105"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${style.text}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium text-foreground truncate transition-colors ${
                      isHoliday ? "" : "group-hover:text-primary"
                    }`}
                  >
                    {event.label || eventTypeLabels[event.type]}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-muted-foreground">{eventTypeLabels[event.type]}</span>
                    {event.hours && (
                      <span className="text-[10px] font-medium text-foreground">{event.hours}h</span>
                    )}
                    {event.project && (
                      <span className="text-[10px] text-muted-foreground truncate">{event.project}</span>
                    )}
                  </div>
                </div>
                {!isHoliday && (
                  <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0.5" />
                )}
              </div>
            )
          })}
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}
