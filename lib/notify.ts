import { toast as addRadSon } from "sonner"
import { emitToastPing, type ToastPingKind } from "@/lib/toast-ping"

function nextToastId(prefix: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

type ToastOpts = {
  description?: string
}

const baseOpts = (prefix: string, { description }: ToastOpts) => ({
  id: nextToastId(prefix),
  ...(description ? { description } : {}),
})

const STYLE_BY_KIND: Record<
  ToastPingKind,
  { toast: string; title: string; description: string }
> = {
  saved: {
    toast:
      "border-0 bg-emerald-50/95 text-emerald-950 shadow-lg ring-1 ring-emerald-500/15 dark:bg-emerald-950/40 dark:text-emerald-50 dark:ring-emerald-400/20",
    title: "font-semibold text-emerald-950 dark:text-emerald-50",
    description: "text-emerald-900/85 dark:text-emerald-100/85",
  },
  updated: {
    toast:
      "border-0 bg-muted/95 text-foreground shadow-lg ring-1 ring-border/60 dark:bg-muted dark:ring-border/50",
    title: "font-semibold text-foreground",
    description: "text-muted-foreground",
  },
  deleted: {
    toast:
      "border-0 bg-amber-50/95 text-amber-950 shadow-lg ring-1 ring-amber-500/15 dark:bg-amber-950/40 dark:text-amber-50 dark:ring-amber-400/20",
    title: "font-semibold text-amber-950 dark:text-amber-50",
    description: "text-amber-900/85 dark:text-amber-100/85",
  },
  error: {
    toast:
      "border-0 bg-red-50/95 text-red-950 shadow-lg ring-1 ring-red-500/12 dark:bg-red-950/35 dark:text-red-50 dark:ring-red-400/18",
    title: "font-semibold text-red-950 dark:text-red-50",
    description: "text-red-900/85 dark:text-red-100/85",
  },
}

function notifyWithPing(
  kind: ToastPingKind,
  title: string,
  description: string | undefined,
  show: (msg: string, opts: { id: string; classNames: typeof STYLE_BY_KIND.saved; description?: string }) => void,
) {
  const cn = STYLE_BY_KIND[kind]
  show(title, {
    ...baseOpts(kind, { description }),
    classNames: {
      toast: cn.toast,
      title: cn.title,
      description: cn.description,
    },
  })
  emitToastPing(kind)
}

/** Enregistrement / validation réussie — vert */
export function notifySaved(title: string, description?: string) {
  notifyWithPing("saved", title, description, (t, o) => addRadSon.success(t, o))
}

/** Modification de données — gris / neutre */
export function notifyUpdated(title: string, description?: string) {
  notifyWithPing("updated", title, description, (t, o) => addRadSon.message(t, o))
}

/** Suppression — orange / ambre */
export function notifyDeleted(title: string, description?: string) {
  notifyWithPing("deleted", title, description, (t, o) => addRadSon.warning(t, o))
}

/** Erreur ou action impossible — rouge */
export function notifyError(title: string, description?: string) {
  notifyWithPing("error", title, description, (t, o) => addRadSon.error(t, o))
}
