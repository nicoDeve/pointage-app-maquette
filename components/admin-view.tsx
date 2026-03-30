"use client"

import { useState } from "react"
import { notifySaved, notifyUpdated } from "@/lib/notify"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Check,
  X,
  Calendar,
  Clock,
  AlertTriangle,
  ChevronRight,
  Bell,
  UserCircle2,
} from "lucide-react"
import { NotificationCountPing } from "@/components/notification-count-ping"
import { AppSidePanel } from "@/components/app-side-panel"
import { AbsenceTypeColoredBadge } from "@/components/app-badges"
import { cn } from "@/lib/utils"
import { uiDensity } from "@/lib/ui-density"
import { appSidePanelTokens } from "@/lib/app-side-panel-tokens"
import {
  AppPanelKind,
  AbsenceTypeCode,
  AdminPendingRequestDomain,
  AdminNotificationKind,
  AdminChangelogKind,
  AdminRejectReasonCode,
} from "@/lib/app-enums"
import { AppLabel, adminRejectReasonLabels } from "@/lib/app-labels"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"

const adminRejectReasonOptions = Object.values(AdminRejectReasonCode)

interface PendingRequest {
  id: string
  domain: AdminPendingRequestDomain
  /** Présent si `domain === absence`. */
  absenceType?: AbsenceTypeCode
  employee: {
    name: string
    avatar?: string
    initials: string
  }
  periodLabel: string
  durationLabel?: string
  status: "pending"
  priority: "normal" | "urgent"
  pole: string
}

const pendingRequests: PendingRequest[] = [
  {
    id: "req1",
    domain: AdminPendingRequestDomain.Absence,
    absenceType: AbsenceTypeCode.CongesPayes,
    employee: { name: "Marie Dupont", initials: "MD" },
    periodLabel: "14 avr. - 18 avr. 2026",
    durationLabel: "5 jours",
    status: "pending",
    priority: "normal",
    pole: "Produit",
  },
  {
    id: "req4",
    domain: AdminPendingRequestDomain.Absence,
    absenceType: AbsenceTypeCode.Teletravail,
    employee: { name: "Sophie Leblanc", initials: "SL" },
    periodLabel: "7 avr. - 11 avr. 2026",
    durationLabel: "5 jours",
    status: "pending",
    priority: "normal",
    pole: "Produit",
  },
  {
    id: "req2",
    domain: AdminPendingRequestDomain.Absence,
    absenceType: AbsenceTypeCode.Maladie,
    employee: { name: "Jean Martin", initials: "JM" },
    periodLabel: "20 mars - 22 mars 2026",
    durationLabel: "3 jours",
    status: "pending",
    priority: "urgent",
    pole: "Tech",
  },
  {
    id: "req5",
    domain: AdminPendingRequestDomain.Absence,
    absenceType: AbsenceTypeCode.CongesPayes,
    employee: { name: "Lucas Bernard", initials: "LB" },
    periodLabel: "21 avr. - 25 avr. 2026",
    durationLabel: "5 jours",
    status: "pending",
    priority: "normal",
    pole: "Tech",
  },
  {
    id: "req3",
    domain: AdminPendingRequestDomain.Absence,
    absenceType: AbsenceTypeCode.SansSolde,
    employee: { name: "Emma Moreau", initials: "EM" },
    periodLabel: "1 mai - 5 mai 2026",
    durationLabel: "5 jours",
    status: "pending",
    priority: "normal",
    pole: "Design",
  },
]

interface Notification {
  id: string
  kind: AdminNotificationKind
  message: string
  employee?: string
  date: string
  read: boolean
}

const notifications: Notification[] = [
  {
    id: "n1",
    kind: AdminNotificationKind.Warning,
    message: "n'a pas pointé la semaine 40",
    employee: "Pierre Durand",
    date: "Il y a 2 jours",
    read: false,
  },
  {
    id: "n2",
    kind: AdminNotificationKind.Warning,
    message: "n'a pas pointé la semaine 40",
    employee: "Lucie Bernard",
    date: "Il y a 2 jours",
    read: false,
  },
  {
    id: "n3",
    kind: AdminNotificationKind.Error,
    message: "a dépassé ses heures supplémentaires (45h/35h)",
    employee: "Marc Petit",
    date: "Il y a 1 jour",
    read: false,
  },
  {
    id: "n4",
    kind: AdminNotificationKind.Info,
    message: "a soumis sa semaine 41 pour validation",
    employee: "Emma Moreau",
    date: "Il y a 3 heures",
    read: true,
  },
]

interface ChangelogEntry {
  id: string
  at: string
  actor: string
  action: string
  detail: string
  kind: AdminChangelogKind
}

const changelogEntries: ChangelogEntry[] = [
  {
    id: "ev1",
    at: "27 mars 2026 · 14:32",
    actor: "Jean Dupont",
    action: "Validation feuille de temps",
    detail: "S12 — Marie Dupont (Produit)",
    kind: AdminChangelogKind.Validation,
  },
  {
    id: "ev2",
    at: "27 mars 2026 · 11:05",
    actor: "Sophie Admin",
    action: "Refus absence",
    detail: "CP — Lucas Bernard · motif « période non autorisée »",
    kind: AdminChangelogKind.Refus,
  },
  {
    id: "ev3",
    at: "26 mars 2026 · 17:18",
    actor: "Jean Dupont",
    action: "Validation absence",
    detail: "Télétravail — Emma Moreau",
    kind: AdminChangelogKind.Validation,
  },
  {
    id: "ev4",
    at: "26 mars 2026 · 09:40",
    actor: "Système",
    action: "Mise à jour règle",
    detail: "Seuil heures sup. équipe Tech → 40h",
    kind: AdminChangelogKind.Config,
  },
  {
    id: "ev5",
    at: "25 mars 2026 · 16:02",
    actor: "Sophie Admin",
    action: "Création compte",
    detail: "Accès standard — pierre.durand@company.com",
    kind: AdminChangelogKind.Compte,
  },
]

function changelogBadgeClass(kind: AdminChangelogKind) {
  switch (kind) {
    case AdminChangelogKind.Validation:
      return "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
    case AdminChangelogKind.Refus:
      return "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
    case AdminChangelogKind.Config:
      return "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200"
    default:
      return "bg-muted text-muted-foreground"
  }
}

function requestTypeSummary(request: PendingRequest): string {
  if (request.domain === AdminPendingRequestDomain.Absence && request.absenceType) {
    const labels: Record<AbsenceTypeCode, string> = {
      conges_payes: AppLabel.absence.typeCongesPayes,
      teletravail: AppLabel.absence.typeTeletravail,
      maladie: AppLabel.absence.typeMaladie,
      sans_solde: AppLabel.absence.typeSansSolde,
    }
    return labels[request.absenceType]
  }
  return AppLabel.admin.timesheetRequestLabel
}

export function AdminView() {
  const { user } = useAuth()
  const isSuperAdmin = user?.accessLevel === "super_admin"

  const [selectedRequest, setSelectedRequest] = useState<PendingRequest | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [requests, setRequests] = useState(pendingRequests)
  const [notifs, setNotifs] = useState(notifications)

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState<AdminRejectReasonCode | "">("")
  const [rejectComment, setRejectComment] = useState("")

  const handleRequestClick = (request: PendingRequest) => {
    setSelectedRequest(request)
    setIsDetailOpen(true)
  }

  const handleApprove = (requestId: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== requestId))
    setIsDetailOpen(false)
    notifySaved(AppLabel.admin.toastApprovedTitle, AppLabel.admin.toastApprovedDesc)
  }

  const openRejectDialog = (requestId: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setRejectingId(requestId)
    setRejectReason("")
    setRejectComment("")
    setRejectDialogOpen(true)
  }

  const confirmReject = () => {
    if (!rejectingId || !rejectReason) return
    setRequests((prev) => prev.filter((r) => r.id !== rejectingId))
    setIsDetailOpen(false)
    setRejectDialogOpen(false)
    setRejectingId(null)
    notifyUpdated(AppLabel.admin.toastRejectedTitle, AppLabel.admin.toastRejectedDesc)
  }

  const handleReject = (requestId: string) => openRejectDialog(requestId)

  const markAsRead = (notifId: string) => {
    setNotifs((prev) => prev.map((n) => (n.id === notifId ? { ...n, read: true } : n)))
  }

  const unreadCount = notifs.filter((n) => !n.read).length

  const detailTitle =
    selectedRequest != null ? (
      <div className="flex min-w-0 items-center gap-3">
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarImage src={selectedRequest.employee.avatar} />
          <AvatarFallback className="bg-muted text-xs text-muted-foreground">
            {selectedRequest.employee.initials}
          </AvatarFallback>
        </Avatar>
        <span className="truncate">{selectedRequest.employee.name}</span>
      </div>
    ) : (
      "—"
    )

  return (
    <div className="flex min-h-[calc(100dvh-9rem)] min-w-0 flex-1 flex-col">
      <Tabs defaultValue="requests" className="flex min-h-0 flex-1 flex-col">
        <TabsList className="shrink-0 rounded-lg bg-muted p-1">
          <TabsTrigger
            value="requests"
            className="data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs"
          >
            {AppLabel.admin.tabPending}
            {requests.length > 0 && (
              <Badge
                aria-label={AppLabel.admin.pendingBadgeAria}
                className={`ml-2 shrink-0 rounded-full border-0 bg-primary p-0 text-[10px] font-semibold tabular-nums leading-none text-primary-foreground shadow-none ${
                  requests.length > 9
                    ? "inline-flex h-5 min-w-5 items-center justify-center px-1"
                    : "inline-flex size-5 items-center justify-center"
                }`}
              >
                {requests.length > 9 ? "9+" : requests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs"
          >
            {AppLabel.admin.tabNotifications}
            <NotificationCountPing
              count={unreadCount}
              variant="destructive"
              className="ml-2"
              label={AppLabel.admin.notificationsUnreadAria}
            />
          </TabsTrigger>
          {isSuperAdmin && (
            <TabsTrigger
              value="journal"
              className="data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs"
            >
              {AppLabel.admin.tabJournal}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="requests" className="mt-3 flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden">
          {requests.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <Check className="mx-auto mb-3 h-8 w-8 text-green-500" />
              <p className="text-xs">{AppLabel.admin.emptyPending}</p>
            </div>
          ) : (
            (() => {
              const grouped = requests.reduce<Record<string, PendingRequest[]>>((acc, r) => {
                ;(acc[r.pole] ??= []).push(r)
                return acc
              }, {})
              return (
                <div className="min-h-0 flex-1 divide-y divide-border overflow-y-auto rounded-lg border border-border">
                  {Object.entries(grouped).map(([pole, reqs]) => (
                    <div key={pole}>
                      <div className={cn(uiDensity.listRowCompact, "flex items-center gap-2 bg-muted/40")}>
                        <span className={cn(uiDensity.sectionTitle, "uppercase tracking-wider text-muted-foreground")}>
                          {pole}
                        </span>
                        <Badge
                          variant="outline"
                          className={`shrink-0 rounded-full border p-0 text-[10px] font-semibold tabular-nums leading-none ${
                            reqs.length > 9
                              ? "inline-flex h-5 min-w-5 items-center justify-center px-1"
                              : "inline-flex size-5 items-center justify-center"
                          }`}
                        >
                          {reqs.length > 9 ? "9+" : reqs.length}
                        </Badge>
                      </div>
                      {reqs.map((request) => (
                        <ContextMenu key={request.id}>
                          <ContextMenuTrigger asChild>
                            <div
                              className={cn(
                                uiDensity.listRowCompact,
                                "group flex cursor-pointer items-center justify-between transition-colors hover:bg-muted/30",
                              )}
                              onClick={() => handleRequestClick(request)}
                            >
                              <div className="flex min-w-0 items-center gap-3">
                                <Avatar className="h-8 w-8 shrink-0">
                                  <AvatarImage src={request.employee.avatar} />
                                  <AvatarFallback className="bg-muted text-xs text-muted-foreground">
                                    {request.employee.initials}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-xs font-medium text-foreground">{request.employee.name}</span>
                                    {request.priority === "urgent" && (
                                      <Badge
                                        variant="outline"
                                        className="h-5 border-amber-500/50 px-1.5 text-[10px] text-amber-800 dark:text-amber-300"
                                      >
                                        {AppLabel.admin.priorityUrgent}
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-muted-foreground">
                                    {requestTypeSummary(request)} · {request.periodLabel}
                                  </p>
                                </div>
                              </div>
                              <div className="flex shrink-0 items-center gap-2">
                                {request.durationLabel != null && (
                                  <span className="text-[11px] text-muted-foreground">{request.durationLabel}</span>
                                )}
                                <div className="flex items-center gap-1">
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    className="h-7 w-7 hover:border-green-400/50 hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-950/30 dark:hover:text-green-400"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleApprove(request.id)
                                    }}
                                  >
                                    <Check className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    className="h-7 w-7 text-muted-foreground hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
                                    onClick={(e) => openRejectDialog(request.id, e)}
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                                <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                              </div>
                            </div>
                          </ContextMenuTrigger>
                          <ContextMenuContent className="w-52">
                            <ContextMenuItem onSelect={() => handleRequestClick(request)}>
                              <UserCircle2 className="mr-2 h-4 w-4" />
                              {AppLabel.admin.openDetail}
                            </ContextMenuItem>
                            <ContextMenuSeparator />
                            <ContextMenuItem onSelect={() => handleApprove(request.id)}>
                              <Check className="mr-2 h-4 w-4 text-green-600" />
                              {AppLabel.admin.approve}
                            </ContextMenuItem>
                            <ContextMenuItem variant="destructive" onSelect={() => openRejectDialog(request.id)}>
                              <X className="mr-2 h-4 w-4" />
                              {AppLabel.admin.reject}
                            </ContextMenuItem>
                          </ContextMenuContent>
                        </ContextMenu>
                      ))}
                    </div>
                  ))}
                </div>
              )
            })()
          )}
        </TabsContent>

        <TabsContent
          value="notifications"
          className="mt-3 flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden"
        >
          <div className="min-h-0 flex-1 divide-y divide-border overflow-y-auto rounded-lg border border-border">
            {notifs.map((notif) => (
              <div
                key={notif.id}
                className={cn(
                  uiDensity.listRowCompact,
                  "flex cursor-pointer items-center gap-3 transition-colors",
                  notif.read ? "hover:bg-muted/30" : "bg-primary/5 hover:bg-primary/10",
                )}
                onClick={() => markAsRead(notif.id)}
              >
                <div
                  className={cn(
                    "flex-shrink-0 rounded-full p-1.5",
                    notif.kind === AdminNotificationKind.Warning && "bg-yellow-100 dark:bg-yellow-900/40",
                    notif.kind === AdminNotificationKind.Error && "bg-red-100 dark:bg-red-900/40",
                    notif.kind === AdminNotificationKind.Info && "bg-blue-100 dark:bg-blue-900/40",
                  )}
                >
                  {notif.kind === AdminNotificationKind.Warning && (
                    <AlertTriangle className="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-400" />
                  )}
                  {notif.kind === AdminNotificationKind.Error && (
                    <AlertTriangle className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                  )}
                  {notif.kind === AdminNotificationKind.Info && (
                    <Bell className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs text-foreground">
                    <span className="font-medium">{notif.employee}</span> {notif.message}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{notif.date}</p>
                </div>
                {!notif.read && <div className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />}
              </div>
            ))}
          </div>
        </TabsContent>

        {isSuperAdmin && (
          <TabsContent value="journal" className="mt-3 flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden">
            <div className="min-h-0 flex-1 overflow-y-auto rounded-md border border-border">
              <div className="divide-y divide-border">
                {changelogEntries.map((entry) => (
                  <div key={entry.id} className={cn(uiDensity.listRowCompact, "hover:bg-muted/20 transition-colors")}>
                    <div className="mb-0.5 flex flex-wrap items-center gap-2">
                      <Badge className={cn("text-[10px] font-normal", changelogBadgeClass(entry.kind))}>
                        {entry.kind === AdminChangelogKind.Validation && AppLabel.admin.changelogValidation}
                        {entry.kind === AdminChangelogKind.Refus && AppLabel.admin.changelogRefus}
                        {entry.kind === AdminChangelogKind.Config && AppLabel.admin.changelogConfig}
                        {entry.kind === AdminChangelogKind.Compte && AppLabel.admin.changelogCompte}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground tabular-nums">{entry.at}</span>
                    </div>
                    <p className="text-xs font-medium text-foreground">{entry.action}</p>
                    <p className="text-[11px] text-muted-foreground">{entry.detail}</p>
                    <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <UserCircle2 className="h-3.5 w-3.5 shrink-0" />
                      <span>{entry.actor}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">{AppLabel.admin.rejectDialogTitle}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                {AppLabel.admin.rejectMotifLabel}{" "}
                <span className="text-destructive">*</span>
              </label>
              <Select
                value={rejectReason === "" ? undefined : rejectReason}
                onValueChange={(v) => setRejectReason(v as AdminRejectReasonCode)}
              >
                <SelectTrigger className="h-9 w-full text-xs">
                  <SelectValue placeholder={AppLabel.admin.rejectMotifRequired} />
                </SelectTrigger>
                <SelectContent>
                  {adminRejectReasonOptions.map((code) => (
                    <SelectItem key={code} value={code} className="text-xs">
                      {adminRejectReasonLabels[code]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                {AppLabel.admin.rejectCommentLabel}{" "}
                <span className="text-[11px] font-normal text-muted-foreground">
                  {AppLabel.admin.rejectCommentOptional}
                </span>
              </label>
              <Textarea
                value={rejectComment}
                onChange={(e) => setRejectComment(e.target.value)}
                placeholder={AppLabel.admin.rejectCommentPlaceholder}
                className="min-h-20 resize-none text-xs"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" className="h-9 text-xs" onClick={() => setRejectDialogOpen(false)}>
              {AppLabel.common.cancel}
            </Button>
            <Button
              disabled={!rejectReason}
              variant="destructive"
              size="sm"
              className="h-9 text-xs"
              onClick={confirmReject}
            >
              <X className="mr-2 h-3.5 w-3.5" />
              {AppLabel.admin.rejectSubmit}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AppSidePanel
        open={isDetailOpen}
        onOpenChange={(open) => {
          setIsDetailOpen(open)
          if (!open) setSelectedRequest(null)
        }}
        panelKind={AppPanelKind.AdminRequestDetail}
        title={detailTitle}
        description={AppLabel.admin.panelEmployeeSubtitle}
        footer={
          selectedRequest ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-9 flex-1 border-green-500/40 text-xs text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950/30"
                onClick={() => handleApprove(selectedRequest.id)}
              >
                <Check className="mr-1.5 h-3.5 w-3.5" />
                {AppLabel.admin.approve}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9 flex-1 text-xs text-muted-foreground hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
                onClick={() => handleReject(selectedRequest.id)}
              >
                <X className="mr-1.5 h-3.5 w-3.5" />
                {AppLabel.admin.reject}
              </Button>
            </div>
          ) : null
        }
      >
        {selectedRequest != null && (
          <div className="space-y-3">
            <div className="divide-y divide-border overflow-hidden rounded-lg border border-border">
              <div className={cn(uiDensity.listRowCompact, "flex items-center justify-between gap-2")}>
                <span className="text-xs text-muted-foreground">{AppLabel.admin.panelFieldType}</span>
                {selectedRequest.domain === AdminPendingRequestDomain.Absence && selectedRequest.absenceType ? (
                  <AbsenceTypeColoredBadge code={selectedRequest.absenceType} />
                ) : (
                  <Badge variant="outline" className="text-xs font-normal">
                    {AppLabel.admin.timesheetRequestLabel}
                  </Badge>
                )}
              </div>
              <div className={cn(uiDensity.listRowCompact, "flex items-center justify-between gap-2")}>
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5 shrink-0" />
                  {AppLabel.admin.panelFieldPeriod}
                </span>
                <span className="text-xs font-medium text-foreground">{selectedRequest.periodLabel}</span>
              </div>
              {selectedRequest.durationLabel != null && (
                <div className={cn(uiDensity.listRowCompact, "flex items-center justify-between gap-2")}>
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    {AppLabel.admin.panelFieldDuration}
                  </span>
                  <span className="text-xs font-medium text-foreground">{selectedRequest.durationLabel}</span>
                </div>
              )}
            </div>

            <div className={appSidePanelTokens.summaryBox}>
              <p className="text-xs text-muted-foreground">
                {AppLabel.admin.panelLeaveBalance} :{" "}
                <span className="font-semibold tabular-nums text-foreground">
                  {AppLabel.admin.panelLeaveBalanceValue}
                </span>
              </p>
            </div>
          </div>
        )}
      </AppSidePanel>
    </div>
  )
}
