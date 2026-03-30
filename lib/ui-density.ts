/**
 * Densité / typo alignées sur le tableau de bord — réutiliser pour cohérence inter-écrans.
 * (Titres section ≈ xs semibold, labels secondaires xs muted, chiffres clés text-2xl bold.)
 */
export const uiDensity = {
  pageStack: "flex flex-col gap-3",
  gridGap: "gap-2",
  cardPad: "p-4",
  cardPadHeader: "px-4 py-3",
  cardPadHeaderCompact: "px-4 py-2.5 pb-2",
  listRowCompact: "px-3 py-2.5",
  kpiLabel: "text-xs font-medium text-muted-foreground",
  kpiValue: "text-2xl font-bold tabular-nums leading-none text-foreground",
  kpiHint: "text-[11px] leading-tight text-muted-foreground",
  sectionTitle: "text-xs font-semibold text-foreground",
} as const
