import { NextResponse } from "next/server"

import {
  FRENCH_PUBLIC_HOLIDAYS_METROPOLE_JSON_URL,
  metropoleYearToApiRows,
  type MetropoleHolidaysJson,
} from "@/lib/french-holidays-metropole"

/**
 * Proxy + cache : export JSON métropole (data.gouv / Etalab), découpé par année.
 * Format de sortie identique à l’ancienne API tableau pour le client existant.
 *
 * @see https://www.data.gouv.fr/dataservices/jours-feries
 */
let memory: { json: MetropoleHolidaysJson; at: number } | null = null
const MEMORY_MS = 86_400_000

async function loadMetropoleAll(): Promise<MetropoleHolidaysJson> {
  if (memory && Date.now() - memory.at < MEMORY_MS) return memory.json

  const upstream = await fetch(FRENCH_PUBLIC_HOLIDAYS_METROPOLE_JSON_URL, {
    next: { revalidate: 86_400 },
  })
  if (!upstream.ok) {
    throw new Error(`Jours fériés upstream ${upstream.status}`)
  }
  const data: unknown = await upstream.json()
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("Format jours fériés inattendu")
  }
  const json = data as MetropoleHolidaysJson
  memory = { json, at: Date.now() }
  return json
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ year: string }> },
) {
  const { year: yearStr } = await context.params
  const year = Number.parseInt(yearStr, 10)
  if (!Number.isFinite(year) || year < 1990 || year > 2100) {
    return NextResponse.json({ error: "Année invalide" }, { status: 400 })
  }

  try {
    const all = await loadMetropoleAll()
    const rows = metropoleYearToApiRows(year, all)
    return NextResponse.json(rows, {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
      },
    })
  } catch {
    return NextResponse.json({ error: "Échec récupération jours fériés" }, { status: 502 })
  }
}
