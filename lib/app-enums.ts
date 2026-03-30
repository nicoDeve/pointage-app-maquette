/**
 * Identifiants stables pour panneaux, analytics, i18n future.
 * Préférer ces constantes aux chaînes en dur dans les `data-*` ou logs.
 */
export const AppPanelKind = {
  DashboardAbsencesSheet: "dashboard_absences_sheet",
  TimesheetDayEdit: "timesheet_day_edit",
  AbsenceRequestDetail: "absence_request_detail",
  AdminRequestDetail: "admin_request_detail",
  SupportUserDetail: "support_user_detail",
} as const

export type AppPanelKind = (typeof AppPanelKind)[keyof typeof AppPanelKind]

/** Domaine absence — aligné sur `Absence["status"]` côté données. */
export const AbsenceStatusCode = {
  Approuvee: "approuvee",
  Refusee: "refusee",
  EnAttente: "en_attente",
} as const

export type AbsenceStatusCode = (typeof AbsenceStatusCode)[keyof typeof AbsenceStatusCode]

/** Filtre liste « Mes demandes » — aligné sur `Absence["status"]` + tout. */
export const AbsenceListFilter = {
  All: "all",
  EnAttente: "en_attente",
  Approuvee: "approuvee",
  Refusee: "refusee",
} as const

export type AbsenceListFilter = (typeof AbsenceListFilter)[keyof typeof AbsenceListFilter]

/** Types d’absence — aligné sur `Absence["type"]`. */
export const AbsenceTypeCode = {
  CongesPayes: "conges_payes",
  Teletravail: "teletravail",
  Maladie: "maladie",
  SansSolde: "sans_solde",
} as const

export type AbsenceTypeCode = (typeof AbsenceTypeCode)[keyof typeof AbsenceTypeCode]

/** Gestion — demande en file d’attente (mock / future API). */
export const AdminPendingRequestDomain = {
  Absence: "absence",
  Timesheet: "timesheet",
} as const

export type AdminPendingRequestDomain =
  (typeof AdminPendingRequestDomain)[keyof typeof AdminPendingRequestDomain]

export const AdminNotificationKind = {
  Warning: "warning",
  Info: "info",
  Error: "error",
} as const

export type AdminNotificationKind = (typeof AdminNotificationKind)[keyof typeof AdminNotificationKind]

export const AdminChangelogKind = {
  Validation: "validation",
  Refus: "refus",
  Config: "config",
  Compte: "compte",
} as const

export type AdminChangelogKind = (typeof AdminChangelogKind)[keyof typeof AdminChangelogKind]

/** Motifs de refus — valeur stockée (select / API). */
export const AdminRejectReasonCode = {
  SoldeInsuffisant: "solde_insuffisant",
  PeriodeNonAutorisee: "periode_non_autorisee",
  ConflitEquipe: "conflit_equipe",
  DelaiPrevenance: "delai_prevenance",
  Doublon: "doublon",
  Autre: "autre",
} as const

export type AdminRejectReasonCode = (typeof AdminRejectReasonCode)[keyof typeof AdminRejectReasonCode]

/** Support — statut synthèse collaborateur (mois / liste). */
export const SupportUserStatusCode = {
  Complet: "complet",
  Incomplet: "incomplet",
  EnRetard: "en_retard",
} as const

export type SupportUserStatusCode = (typeof SupportUserStatusCode)[keyof typeof SupportUserStatusCode]

/** Onglets principaux de la page Support. */
export const SupportMainTab = {
  Mensuel: "mensuel",
  Collaborateurs: "collaborateurs",
} as const

export type SupportMainTab = (typeof SupportMainTab)[keyof typeof SupportMainTab]

/** Onglets du panneau latéral (détail collaborateur). */
export const SupportDetailTab = {
  Weekly: "weekly",
  Profile: "profile",
} as const

export type SupportDetailTab = (typeof SupportDetailTab)[keyof typeof SupportDetailTab]

/** Portée de la liste de mois (sélecteur « Période analysée »). */
export const SupportMonthListScope = {
  All: "all",
  ThroughCurrent: "through_current",
  PastOnly: "past_only",
} as const

export type SupportMonthListScope = (typeof SupportMonthListScope)[keyof typeof SupportMonthListScope]

/** Phase affichée sur l’accordéon mois (vue mensuelle). */
export const SupportMonthPhase = {
  Archive: "archive",
  Complet: "complet",
  EnCours: "en_cours",
} as const

export type SupportMonthPhase = (typeof SupportMonthPhase)[keyof typeof SupportMonthPhase]
