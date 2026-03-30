/**
 * Source officielle des jours fériés (métropole), référencée depuis data.gouv.fr
 * (jeu de données « Jours fériés en France », export JSON Etalab).
 *
 * @see https://www.data.gouv.fr/dataservices/jours-feries
 * @see https://www.data.gouv.fr/fr/datasets/jours-feries-en-france/
 */
export const FRENCH_PUBLIC_HOLIDAYS_METROPOLE_JSON_URL =
  "https://etalab.github.io/jours-feries-france-data/json/metropole.json" as const

export type MetropoleHolidaysJson = Record<string, string>

/** Filtre le JSON complet sur une année civile (clés YYYY-MM-DD). */
export function metropoleHolidaysForYear(
  all: MetropoleHolidaysJson,
  year: number,
): Map<string, string> {
  const prefix = `${year}-`
  const m = new Map<string, string>()
  for (const [date, label] of Object.entries(all)) {
    if (date.startsWith(prefix) && typeof label === "string") m.set(date, label)
  }
  return m
}

/** Format attendu par le client (aligné sur l’ancienne API tableau gouv). */
export function metropoleYearToApiRows(year: number, all: MetropoleHolidaysJson) {
  const map = metropoleHolidaysForYear(all, year)
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, nom_jour_ferie]) => ({ date, nom_jour_ferie }))
}
