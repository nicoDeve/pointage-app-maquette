/** Blocs récap à l’intérieur du corps d’un panneau (pointage, absences détail, etc.). */
export const appSidePanelTokens = {
  summaryBox: "rounded-lg border border-border bg-muted/20 p-3",
  summaryHeaderRow: "flex items-center justify-between gap-2 mb-2",
  summaryFooterRow: "flex items-center justify-between gap-2 pt-2 px-0.5",
  summaryLabel: "text-xs text-muted-foreground",
  summaryValue: "text-sm font-semibold tabular-nums text-foreground",
  summaryValueMuted: "text-sm font-semibold tabular-nums text-muted-foreground",
  summarySub: "text-xs text-muted-foreground tabular-nums",
} as const
