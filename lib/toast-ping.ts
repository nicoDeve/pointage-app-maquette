export type ToastPingKind = "saved" | "updated" | "deleted" | "error"

const EVENT = "app:toast-ping"

export type ToastPingDetail = { kind: ToastPingKind }

/** Émis à chaque toast applicatif — pour animer cloche / pastilles en même temps (sans tout faire pulser en boucle). */
export function emitToastPing(kind: ToastPingKind) {
  if (typeof window === "undefined") return

  try {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      if (kind === "error") navigator.vibrate(14)
      else if (kind === "deleted") navigator.vibrate(8)
      else navigator.vibrate(5)
    }
  } catch {
    /* vibrate peut être refusé par le navigateur */
  }

  window.dispatchEvent(new CustomEvent<ToastPingDetail>(EVENT, { detail: { kind } }))
}

export function subscribeToastPing(handler: (e: CustomEvent<ToastPingDetail>) => void) {
  if (typeof window === "undefined") return () => {}
  const fn = (ev: Event) => handler(ev as CustomEvent<ToastPingDetail>)
  window.addEventListener(EVENT, fn)
  return () => window.removeEventListener(EVENT, fn)
}
