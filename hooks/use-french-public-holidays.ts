"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

export type FrenchHolidayMap = ReadonlyMap<string, string>

interface GouvHolidayRow {
  date: string
  nom_jour_ferie: string
}

const memoryCache = new Map<number, FrenchHolidayMap>()

function rowsToMap(rows: GouvHolidayRow[]): FrenchHolidayMap {
  const m = new Map<string, string>()
  for (const r of rows) {
    if (r.date && r.nom_jour_ferie) m.set(r.date, r.nom_jour_ferie)
  }
  return m
}

/**
 * Charge les jours fériés (métropole) via notre route API Next, avec cache mémoire par année.
 */
export function useFrenchPublicHolidays(years: readonly number[]) {
  const [maps, setMaps] = useState<Map<number, FrenchHolidayMap>>(() => new Map())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const yearsKey = useMemo(() => [...new Set(years)].sort((a, b) => a - b).join(","), [years])
  const inFlight = useRef<Map<number, Promise<void>>>(new Map())

  const loadYear = useCallback(async (year: number) => {
    if (memoryCache.has(year)) {
      setMaps((prev) => {
        const hit = memoryCache.get(year)!
        if (prev.get(year) === hit) return prev
        const next = new Map(prev)
        next.set(year, hit)
        return next
      })
      return
    }

    const existing = inFlight.current.get(year)
    if (existing) {
      await existing
      return
    }

    const p = (async () => {
      const res = await fetch(`/api/jours-feries/${year}`)
      if (!res.ok) throw new Error(`Jours fériés ${year}: ${res.status}`)
      const data: GouvHolidayRow[] = await res.json()
      const map = rowsToMap(Array.isArray(data) ? data : [])
      memoryCache.set(year, map)
      setMaps((prev) => {
        const next = new Map(prev)
        next.set(year, map)
        return next
      })
    })().finally(() => {
      inFlight.current.delete(year)
    })

    inFlight.current.set(year, p)
    await p
  }, [])

  useEffect(() => {
    const list = yearsKey.split(",").map(Number).filter((n) => Number.isFinite(n))
    if (list.length === 0) return

    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        for (const y of list) {
          if (cancelled) break
          await loadYear(y)
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Erreur jours fériés")
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [yearsKey, loadYear])

  const getHolidayName = useCallback(
    (dateKey: string, year: number): string | undefined => maps.get(year)?.get(dateKey),
    [maps],
  )

  return { maps, loading, error, getHolidayName, loadYear }
}
