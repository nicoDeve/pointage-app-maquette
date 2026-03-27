"use client"

import * as React from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { Badge } from "@/components/ui/badge"
import { Briefcase, Users, Palmtree, AlertTriangle, ChevronRight, Clock } from "lucide-react"

// ─── Event types (variante "events") ────────────────────────────────────────

export interface EventItem {
  type: "work" | "meeting" | "absence" | "deadline"
  label?: string
  hours?: number
  project?: string
}

// ─── Stat row (variante "stats") ─────────────────────────────────────────────

export interface StatRow {
  label: string
  value: string
  /** Affichage atténué (xs, muted) pour les notes de bas de tableau */
  subtle?: boolean
}

// ─── Thèmes de gradient disponibles ─────────────────────────────────────────

export type GradientTheme = "blue" | "orange" | "purple" | "red" | "default"

const gradientClasses: Record<GradientTheme, string> = {
  blue:    "from-blue-50   to-blue-50/50   dark:from-blue-950/50   dark:to-blue-950/20",
  orange:  "from-orange-50 to-orange-50/50 dark:from-orange-950/50 dark:to-orange-950/20",
  purple:  "from-purple-50 to-purple-50/50 dark:from-purple-950/50 dark:to-purple-950/20",
  red:     "from-red-50    to-red-50/50    dark:from-red-950/50    dark:to-red-950/20",
  default: "from-muted/80  to-muted/40",
}

// ─── Styles d'événements ──────────────────────────────────────────────────────

const eventStyles: Record<EventItem["type"], { bg: string; text: string }> = {
  work:     { bg: "bg-blue-100   dark:bg-blue-900/50",   text: "text-blue-600   dark:text-blue-400"   },
  meeting:  { bg: "bg-purple-100 dark:bg-purple-900/50", text: "text-purple-600 dark:text-purple-400" },
  absence:  { bg: "bg-orange-100 dark:bg-orange-900/50", text: "text-orange-600 dark:text-orange-400" },
  deadline: { bg: "bg-red-100    dark:bg-red-900/50",    text: "text-red-600    dark:text-red-400"    },
}

const eventIcons: Record<EventItem["type"], React.ElementType> = {
  work:     Briefcase,
  meeting:  Users,
  absence:  Palmtree,
  deadline: AlertTriangle,
}

const eventTypeLabels: Record<EventItem["type"], string> = {
  work:     "Travail",
  meeting:  "Reunion",
  absence:  "Absence",
  deadline: "Deadline",
}

// ─── Correspondance type → thème ─────────────────────────────────────────────

const eventTypeToTheme: Record<EventItem["type"], GradientTheme> = {
  work:     "blue",
  meeting:  "purple",
  absence:  "orange",
  deadline: "red",
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface BaseInfoCardProps {
  children: React.ReactNode
  title: string
  subtitle?: string
  badge?: string
  theme?: GradientTheme
  side?: "top" | "bottom" | "left" | "right"
  align?: "start" | "center" | "end"
  /** Largeur Tailwind de la card, ex: "w-72", "w-80" (défaut: "w-72") */
  width?: string
  /** Classes CSS appliquées au div wrapper du trigger (défaut: "") */
  triggerClassName?: string
  /**
   * Mode d'ouverture :
   * - "hover" (défaut) → s'ouvre au survol, comme une HoverCard
   * - "click"          → s'ouvre au clic, comme un Popover
   */
  trigger?: "hover" | "click"
  /** Bouton d'action dans le pied de la card */
  action?: {
    label: string
    icon?: React.ReactNode
    onClick: () => void
  }
}

interface EventsVariantProps extends BaseInfoCardProps {
  variant: "events"
  events: EventItem[]
  totalHours?: number
  onEventClick?: (event: EventItem) => void
}

interface StatsVariantProps extends BaseInfoCardProps {
  variant: "stats"
  stats: StatRow[]
}

/**
 * Variante libre — passez directement le contenu de la card via `content`.
 * Utile pour le dashboard ou tout usage futur sans structure prédéfinie.
 */
interface CustomVariantProps extends BaseInfoCardProps {
  variant: "custom"
  content: React.ReactNode
}

export type InfoCardPopoverProps =
  | EventsVariantProps
  | StatsVariantProps
  | CustomVariantProps

// ─── Contenu interne ─────────────────────────────────────────────────────────

function CardBody(props: InfoCardPopoverProps) {
  const { title, subtitle, badge, action } = props

  const resolvedTheme: GradientTheme =
    props.theme ??
    (props.variant === "events" && props.events[0]?.type
      ? eventTypeToTheme[props.events[0].type]
      : "default")

  return (
    <>
      {/* ── En-tête ── */}
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
        {(subtitle || (props.variant === "events" && props.totalHours !== undefined)) && (
          <div className="flex items-center gap-2 mt-1">
            {subtitle && (
              <span className="text-xs text-muted-foreground">{subtitle}</span>
            )}
            {props.variant === "events" && props.totalHours !== undefined && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {props.totalHours}h
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Contenu ── */}
      {props.variant === "events" && (
        <div className="p-2 space-y-1 max-h-64 overflow-y-auto">
          {props.events.map((event, idx) => {
            const Icon  = eventIcons[event.type]
            const style = eventStyles[event.type]
            return (
              <div
                key={idx}
                className="flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all hover:bg-muted/80 group"
                onClick={(e) => {
                  e.stopPropagation()
                  props.onEventClick?.(event)
                }}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 ${style.bg}`}
                >
                  <Icon className={`w-4 h-4 ${style.text}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                    {event.label || eventTypeLabels[event.type]}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-muted-foreground">
                      {eventTypeLabels[event.type]}
                    </span>
                    {event.hours && (
                      <span className="text-[10px] font-medium text-foreground">
                        {event.hours}h
                      </span>
                    )}
                    {event.project && (
                      <span className="text-[10px] text-muted-foreground truncate">
                        {event.project}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0.5" />
              </div>
            )
          })}
        </div>
      )}

      {props.variant === "stats" && (
        <div className="p-4 space-y-3">
          {props.stats.map((stat, idx) =>
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
            )
          )}
        </div>
      )}

      {props.variant === "custom" && props.content}

      {/* ── Pied / Action ── */}
      {action && (
        <div
          className="px-4 py-3 border-t border-border bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={action.onClick}
        >
          <button className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors w-full justify-center group">
            {action.icon}
            <span>{action.label}</span>
            <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all" />
          </button>
        </div>
      )}
    </>
  )
}

// ─── Composant principal ──────────────────────────────────────────────────────

/**
 * Card d'information générique réutilisable.
 *
 * Utilisations prêtes à l'emploi :
 *  - variant="events"  → liste d'événements typés (calendrier, trigger="hover")
 *  - variant="stats"   → lignes clé/valeur + action (congés, absences, trigger="click")
 *  - variant="custom"  → contenu libre (dashboard, etc.)
 *
 * Prop `trigger` :
 *  - "hover" (défaut) → s'ouvre au survol de la souris (HoverCard)
 *  - "click"          → s'ouvre au clic (Popover)
 */
export function InfoCardPopover(props: InfoCardPopoverProps) {
  const {
    children,
    side = "right",
    align = "start",
    width = "w-72",
    trigger = "hover",
    triggerClassName = "",
  } = props

  const isEmpty =
    (props.variant === "events" && props.events.length === 0) ||
    (props.variant === "stats"  && props.stats.length  === 0)

  // Quand vide : toujours rendre le wrapper avec triggerClassName pour conserver le style/spacing
  if (isEmpty) return <div className={triggerClassName}>{children}</div>

  const contentClass = `${width} p-0 shadow-xl border border-border/50 overflow-hidden`

  if (trigger === "hover") {
    return (
      <HoverCard openDelay={150} closeDelay={100}>
        <HoverCardTrigger asChild>
          <div className={triggerClassName}>{children}</div>
        </HoverCardTrigger>
        <HoverCardContent className={contentClass} side={side} align={align}>
          <CardBody {...props} />
        </HoverCardContent>
      </HoverCard>
    )
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className={`cursor-pointer ${triggerClassName}`}>{children}</div>
      </PopoverTrigger>
      <PopoverContent className={contentClass} side={side} align={align}>
        <CardBody {...props} />
      </PopoverContent>
    </Popover>
  )
}
