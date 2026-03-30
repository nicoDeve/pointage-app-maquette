"use client"

import { useEffect, useState, type CSSProperties } from "react"
import type { ToastPingKind } from "@/lib/toast-ping"
import { subscribeToastPing } from "@/lib/toast-ping"
import { cn } from "@/lib/utils"

const BURST_COLOR: Record<ToastPingKind, string> = {
  saved: "rgba(16, 185, 129, 0.42)",
  updated: "rgba(100, 116, 139, 0.38)",
  deleted: "rgba(245, 158, 11, 0.42)",
  error: "rgba(239, 68, 68, 0.42)",
}

/**
 * Couche d’animation à placer dans un parent `relative` : une onde par toast, synchronisée avec `lib/notify`.
 */
export function ToastPingLayer({ className }: { className?: string }) {
  const [burst, setBurst] = useState<{ key: number; kind: ToastPingKind } | null>(null)

  useEffect(() => {
    return subscribeToastPing((e) => {
      setBurst({ key: Date.now(), kind: e.detail.kind })
    })
  }, [])

  if (!burst) return null

  return (
    <span
      key={burst.key}
      className={cn(
        "app-toast-ping-burst pointer-events-none absolute inset-[-3px] z-0 rounded-lg",
        className,
      )}
      style={{ "--app-ping-burst": BURST_COLOR[burst.kind] } as CSSProperties}
      aria-hidden
    />
  )
}
