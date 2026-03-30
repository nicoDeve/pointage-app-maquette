"use client"

import type { Absence, WeekData } from "@/contexts/timesheet-context"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { AbsenceTypeCode } from "@/lib/app-enums"
import { AppLabel } from "@/lib/app-labels"

/** Même styles que `getStatusBadge` dans `absences-view.tsx`. */
export function AbsenceStatusBadge({ status, className }: { status: Absence["status"]; className?: string }) {
  switch (status) {
    case "approuvee":
      return (
        <Badge
          className={cn(
            "bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/40 dark:text-green-300 text-xs font-normal",
            className,
          )}
        >
          approuvee
        </Badge>
      )
    case "refusee":
      return (
        <Badge
          className={cn(
            "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/40 dark:text-red-300 text-xs font-normal",
            className,
          )}
        >
          refusee
        </Badge>
      )
    default:
      return (
        <Badge
          className={cn(
            "bg-yellow-100 text-yellow-700 hover:bg-yellow-100 dark:bg-yellow-900/40 dark:text-yellow-300 text-xs font-normal",
            className,
          )}
        >
          En attente
        </Badge>
      )
  }
}

/** Badge type d’absence (liste Absences, fiches synthèse). */
export function AbsenceTypeBadge({ label, className }: { label: string; className?: string }) {
  return (
    <Badge className={cn("bg-[#18181b] text-white hover:bg-[#18181b] text-xs font-normal", className)}>{label}</Badge>
  )
}

const absenceTypeColoredClasses: Record<AbsenceTypeCode, string> = {
  conges_payes:
    "bg-violet-100 text-violet-700 hover:bg-violet-100 dark:bg-violet-900/40 dark:text-violet-300 text-xs font-normal",
  teletravail:
    "bg-sky-100 text-sky-700 hover:bg-sky-100 dark:bg-sky-900/40 dark:text-sky-300 text-xs font-normal",
  maladie: "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/40 dark:text-red-300 text-xs font-normal",
  sans_solde: "bg-muted text-muted-foreground hover:bg-muted text-xs font-normal",
}

const absenceTypeLabel: Record<AbsenceTypeCode, string> = {
  conges_payes: AppLabel.absence.typeCongesPayes,
  teletravail: AppLabel.absence.typeTeletravail,
  maladie: AppLabel.absence.typeMaladie,
  sans_solde: AppLabel.absence.typeSansSolde,
}

/** Badge type d’absence coloré (gestion, détail). */
export function AbsenceTypeColoredBadge({ code, className }: { code: AbsenceTypeCode; className?: string }) {
  return (
    <Badge className={cn(absenceTypeColoredClasses[code], className)}>{absenceTypeLabel[code]}</Badge>
  )
}

/** Statut semaine (liste semaines + bandeau semaine) — comme `timesheet-view`. */
export function WeekHoursStatusBadge({ status, className }: { status: WeekData["status"]; className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs font-normal",
        status === "complet"
          ? "border-green-500/50 text-green-700 dark:text-green-400"
          : "border-red-400/50 text-red-600 dark:text-red-400",
        className,
      )}
    >
      {status}
    </Badge>
  )
}
