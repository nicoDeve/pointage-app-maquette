"use client"

import { useState, type CSSProperties } from "react"
import { cn } from "@/lib/utils"

/** Doit correspondre à la durée dans `globals.css` (.notification-ping-halo). */
export const NOTIFICATION_PING_PERIOD_MS = 2200

type Variant = "destructive" | "primary"

const variantClasses: Record<
  Variant,
  { badge: string; ping: string; pingCssVar: string; text: string }
> = {
  destructive: {
    badge: "bg-destructive",
    ping: "bg-destructive/50",
    pingCssVar: "var(--destructive)",
    text: "text-white",
  },
  primary: {
    badge: "bg-primary",
    ping: "bg-primary/45",
    pingCssVar: "var(--primary)",
    text: "text-primary-foreground",
  },
}

/**
 * Pastille compteur. Par défaut **sans** halo infini (discret) — la synchro « vivante » passe par
 * `ToastPingTarget` + toasts. Activer `ambientHalo` pour l’ancienne pulsation continue (phase globale).
 */
export function NotificationCountPing({
  count,
  className,
  variant = "destructive",
  label,
  ambientHalo = false,
}: {
  count: number
  className?: string
  variant?: Variant
  /** Libellé accessibilité, ex. « notifications non lues » */
  label?: string
  /** Halo animé en boucle (plusieurs pastilles en phase) — désactivé par défaut */
  ambientHalo?: boolean
}) {
  const [delaySec] = useState(
    () => `${-(Date.now() % NOTIFICATION_PING_PERIOD_MS) / 1000}s`,
  )

  if (count <= 0) return null

  const wide = count > 9
  const v = variantClasses[variant]

  return (
    <span className={cn("relative inline-flex flex-none shrink-0", className)}>
      {ambientHalo ? (
        <span
          className={cn(
            "notification-ping-halo pointer-events-none absolute inset-0 rounded-full opacity-75",
            v.ping,
          )}
          style={{ animationDelay: delaySec }}
          aria-hidden
        />
      ) : (
        <span
          className="notification-badge-bloom pointer-events-none absolute z-0 rounded-full -inset-[7px]"
          style={{ "--ping-color": v.pingCssVar } as CSSProperties}
          aria-hidden
        />
      )}
      <span
        className={cn(
          "relative z-[1] inline-flex items-center justify-center rounded-full font-semibold tabular-nums leading-none text-[10px] shadow-sm",
          v.badge,
          v.text,
          wide ? "h-5 min-w-[1.25rem] px-1" : "h-5 w-5",
        )}
        aria-label={label}
      >
        {wide ? "9+" : count}
      </span>
    </span>
  )
}
