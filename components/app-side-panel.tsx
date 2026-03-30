"use client"

import * as React from "react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import type { AppPanelKind } from "@/lib/app-enums"

const widthClass = {
  /** ~22rem, style tableau de bord */
  narrow: "sm:max-w-[min(100vw-2rem,22rem)]",
  /** shadcn md */
  default: "sm:max-w-md",
  /** listes riches (ex. Support) */
  wide: "sm:max-w-lg",
} as const

export type AppSidePanelWidth = keyof typeof widthClass

export interface AppSidePanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: React.ReactNode
  description?: React.ReactNode
  /** Contenu scrollable (formulaires, listes). */
  children: React.ReactNode
  /** Bandeau optionnel sous la bordure du sheet (alerte, contexte). */
  banner?: React.ReactNode
  /** Pied fixe (bouton principal). Si absent, pas de bandeau bas. */
  footer?: React.ReactNode
  width?: AppSidePanelWidth
  /** Pour tests / analytics — voir `AppPanelKind`. */
  panelKind?: AppPanelKind
  className?: string
}

/**
 * Coque commune des feuilles latérales : en-tête compact (comme tableau de bord),
 * zone centrale scrollable, pied optionnel.
 */
export function AppSidePanel({
  open,
  onOpenChange,
  title,
  description,
  children,
  banner,
  footer,
  width = "narrow",
  panelKind,
  className,
}: AppSidePanelProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        data-app-panel={panelKind}
        className={cn(
          "flex w-full flex-col gap-0 border-l p-0 overflow-hidden",
          widthClass[width],
          className,
        )}
      >
        {banner}
        <SheetHeader className="shrink-0 space-y-0 border-b border-border px-4 py-3 text-left">
          <SheetTitle className="text-sm font-semibold">{title}</SheetTitle>
          {description != null ? (
            <SheetDescription className="text-[11px] leading-snug text-muted-foreground">
              {description}
            </SheetDescription>
          ) : null}
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-2">{children}</div>
        {footer != null ? <div className="shrink-0 border-t border-border p-3">{footer}</div> : null}
      </SheetContent>
    </Sheet>
  )
}
