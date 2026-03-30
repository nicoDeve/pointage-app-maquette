"use client"

import { Button } from "@/components/ui/button"
import { NotificationCountPing } from "@/components/notification-count-ping"
import { ToastPingLayer } from "@/components/toast-ping-layer"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Home,
  PencilLine,
  XCircle,
  History,
} from "lucide-react"

type ActivityLogKind =
  | "conges"
  | "conges_refus"
  | "retard"
  | "teletravail"
  | "modif"
  | "validation_ts"

interface ActivityLogEntry {
  id: string
  kind: ActivityLogKind
  title: string
  detail: string
  actor: string
  timeLabel: string
  unread?: boolean
}

/** Maquette — à remplacer par l’API logs / utilisateur */
const MOCK_ACTIVITY_LOGS: ActivityLogEntry[] = [
  {
    id: "1",
    kind: "retard",
    title: "Pointage incomplet",
    detail: "Semaine 40 — objectif 35h non atteint",
    actor: "Vous",
    timeLabel: "Il y a 2 h",
    unread: true,
  },
  {
    id: "2",
    kind: "conges",
    title: "Congés payés approuvés",
    detail: "14–18 avr. 2026 · 5 jours",
    actor: "Marie Dupont (RH)",
    timeLabel: "Il y a 5 h",
    unread: true,
  },
  {
    id: "3",
    kind: "teletravail",
    title: "Télétravail validé",
    detail: "7–11 avr. 2026 · semaine entière",
    actor: "Jean Martin (N+1)",
    timeLabel: "Hier",
    unread: true,
  },
  {
    id: "4",
    kind: "modif",
    title: "Saisie modifiée",
    detail: "Activité « Alpha Refonte » — mardi S41 : 6h → 7h",
    actor: "Vous",
    timeLabel: "Hier",
  },
  {
    id: "5",
    kind: "validation_ts",
    title: "Feuille de temps validée",
    detail: "Semaine 39 marquée comme complète",
    actor: "Support RH",
    timeLabel: "Il y a 3 jours",
  },
  {
    id: "6",
    kind: "conges_refus",
    title: "Demande de congés refusée",
    detail: "Motif : solde insuffisant — 1er mai",
    actor: "Sophie Leblanc (RH)",
    timeLabel: "Il y a 4 jours",
  },
]

function activityLogIcon(kind: ActivityLogKind) {
  switch (kind) {
    case "conges":
      return <CheckCircle2 className="w-4 h-4 text-violet-600 dark:text-violet-400" />
    case "conges_refus":
      return <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
    case "retard":
      return <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
    case "teletravail":
      return <Home className="w-4 h-4 text-sky-600 dark:text-sky-400" />
    case "modif":
      return <PencilLine className="w-4 h-4 text-blue-600 dark:text-blue-400" />
    case "validation_ts":
      return <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
    default:
      return <History className="w-4 h-4 text-muted-foreground" />
  }
}

export function ActivityLogPopover() {
  const unread = MOCK_ACTIVITY_LOGS.filter((e) => e.unread).length

  return (
    <div className="relative inline-flex shrink-0">
      <ToastPingLayer />
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="relative z-[1] h-9 w-9 shrink-0 overflow-visible"
            aria-label="Journal d’activité"
          >
            <Bell className="h-4 w-4 text-muted-foreground" />
            <NotificationCountPing
              count={unread}
              variant="primary"
              className="absolute -right-0.5 -top-0.5 z-[2]"
              label="Entrées d’activité non lues"
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96 p-0" align="end" sideOffset={6}>
        <div className="px-4 py-3 border-b border-border bg-muted/30">
          <p className="text-sm font-semibold text-foreground">Activité récente</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Retards, validations congés / TT, modifications — aperçu (données fictives)
          </p>
        </div>
        <ScrollArea className="h-[min(420px,65dvh)]">
          <div className="divide-y divide-border">
            {MOCK_ACTIVITY_LOGS.map((entry) => (
              <div
                key={entry.id}
                className={`px-4 py-3 flex gap-3 ${entry.unread ? "bg-primary/5" : ""}`}
              >
                <div className="mt-0.5 flex-shrink-0 p-1.5 rounded-md bg-muted/60 border border-border/60">
                  {activityLogIcon(entry.kind)}
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-foreground leading-tight">{entry.title}</p>
                    {entry.unread && (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" aria-hidden />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-snug">{entry.detail}</p>
                  <p className="text-[11px] text-muted-foreground">
                    <span className="font-medium text-foreground/80">{entry.actor}</span>
                    <span className="mx-1">·</span>
                    {entry.timeLabel}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  )
}
