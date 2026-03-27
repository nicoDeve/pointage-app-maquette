"use client"

import { useState } from "react"
import { useTimesheet } from "@/contexts/timesheet-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
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
  Bell
} from "lucide-react"

const REJECT_REASONS = [
  "Solde insuffisant",
  "Période non autorisée",
  "Conflit d'équipe",
  "Délai de prévenance non respecté",
  "Doublon de demande",
  "Autre",
]

interface PendingRequest {
  id: string
  type: "absence" | "timesheet"
  employee: {
    name: string
    avatar?: string
    initials: string
  }
  details: string
  date: string
  duration?: string
  status: "pending"
  priority: "normal" | "urgent"
  pole: string
}

const pendingRequests: PendingRequest[] = [
  {
    id: "req1",
    type: "absence",
    employee: { name: "Marie Dupont", initials: "MD" },
    details: "Conges payes",
    date: "14 avr. - 18 avr. 2026",
    duration: "5 jours",
    status: "pending",
    priority: "normal",
    pole: "Produit"
  },
  {
    id: "req4",
    type: "absence",
    employee: { name: "Sophie Leblanc", initials: "SL" },
    details: "Télétravail",
    date: "7 avr. - 11 avr. 2026",
    duration: "5 jours",
    status: "pending",
    priority: "normal",
    pole: "Produit"
  },
  {
    id: "req2",
    type: "absence",
    employee: { name: "Jean Martin", initials: "JM" },
    details: "Maladie",
    date: "20 mars - 22 mars 2026",
    duration: "3 jours",
    status: "pending",
    priority: "urgent",
    pole: "Tech"
  },
  {
    id: "req5",
    type: "absence",
    employee: { name: "Lucas Bernard", initials: "LB" },
    details: "Conges payes",
    date: "21 avr. - 25 avr. 2026",
    duration: "5 jours",
    status: "pending",
    priority: "normal",
    pole: "Tech"
  },
  {
    id: "req3",
    type: "absence",
    employee: { name: "Emma Moreau", initials: "EM" },
    details: "Sans solde",
    date: "1 mai - 5 mai 2026",
    duration: "5 jours",
    status: "pending",
    priority: "normal",
    pole: "Design"
  },
]

interface Notification {
  id: string
  type: "warning" | "info" | "error"
  message: string
  employee?: string
  date: string
  read: boolean
}

const notifications: Notification[] = [
  {
    id: "n1",
    type: "warning",
    message: "n'a pas pointe la semaine 40",
    employee: "Pierre Durand",
    date: "Il y a 2 jours",
    read: false
  },
  {
    id: "n2",
    type: "warning",
    message: "n'a pas pointe la semaine 40",
    employee: "Lucie Bernard",
    date: "Il y a 2 jours",
    read: false
  },
  {
    id: "n3",
    type: "error",
    message: "a depasse ses heures supplementaires (45h/35h)",
    employee: "Marc Petit",
    date: "Il y a 1 jour",
    read: false
  },
  {
    id: "n4",
    type: "info",
    message: "a soumis sa semaine 41 pour validation",
    employee: "Emma Moreau",
    date: "Il y a 3 heures",
    read: true
  },
]

export function AdminView() {
  const [selectedRequest, setSelectedRequest] = useState<PendingRequest | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [requests, setRequests] = useState(pendingRequests)
  const [notifs, setNotifs] = useState(notifications)

  // État dialog de refus
  const [rejectDialogOpen,  setRejectDialogOpen]  = useState(false)
  const [rejectingId,       setRejectingId]        = useState<string | null>(null)
  const [rejectReason,      setRejectReason]       = useState("")
  const [rejectComment,     setRejectComment]      = useState("")

  const handleRequestClick = (request: PendingRequest) => {
    setSelectedRequest(request)
    setIsDetailOpen(true)
  }

  const handleApprove = (requestId: string) => {
    setRequests(prev => prev.filter(r => r.id !== requestId))
    setIsDetailOpen(false)
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
    setRequests(prev => prev.filter(r => r.id !== rejectingId))
    setIsDetailOpen(false)
    setRejectDialogOpen(false)
    setRejectingId(null)
  }

  const handleReject = (requestId: string) => openRejectDialog(requestId)

  const markAsRead = (notifId: string) => {
    setNotifs(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n))
  }

  const unreadCount = notifs.filter(n => !n.read).length

  return (
    <div>
      <Tabs defaultValue="requests" className="w-full">
        <TabsList className="bg-muted p-1 rounded-lg">
          <TabsTrigger value="requests" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Demandes en attente
            {requests.length > 0 && (
              <Badge className="ml-2 bg-primary text-primary-foreground text-xs">{requests.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Notifications
            {unreadCount > 0 && (
              <Badge className="ml-2 bg-destructive text-white text-xs">{unreadCount}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="mt-3">
          {requests.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Check className="w-8 h-8 mx-auto text-green-500 mb-3" />
              <p className="text-sm">Aucune demande en attente</p>
            </div>
          ) : (() => {
            const grouped = requests.reduce<Record<string, PendingRequest[]>>((acc, r) => {
              ;(acc[r.pole] ??= []).push(r)
              return acc
            }, {})
            return (
              <div className="border border-border rounded-lg overflow-hidden divide-y divide-border">
                {Object.entries(grouped).map(([pole, reqs]) => (
                  <div key={pole}>
                    <div className="px-4 py-2 bg-muted/40 flex items-center gap-2">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{pole}</span>
                      <Badge variant="outline" className="text-xs font-normal h-4 px-1.5">{reqs.length}</Badge>
                    </div>
                    {reqs.map((request) => (
                      <div
                        key={request.id}
                        className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer group"
                        onClick={() => handleRequestClick(request)}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={request.employee.avatar} />
                            <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                              {request.employee.initials}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <span className="text-sm font-medium text-foreground">{request.employee.name}</span>
                            <p className="text-xs text-muted-foreground">{request.details} · {request.date}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground">{request.duration}</span>
                          <div className="flex items-center gap-1.5">
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-7 w-7 hover:bg-green-50 dark:hover:bg-green-950/30 hover:text-green-600 dark:hover:text-green-400 hover:border-green-400/50"
                              onClick={(e) => { e.stopPropagation(); handleApprove(request.id) }}
                            >
                              <Check className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-7 w-7 text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/40"
                              onClick={(e) => openRejectDialog(request.id, e)}
                            >
                              <X className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )
          })()}
        </TabsContent>

        <TabsContent value="notifications" className="mt-3">
          <div className="divide-y divide-border border border-border rounded-lg overflow-hidden">
            {notifs.map((notif) => (
              <div
                key={notif.id}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                  notif.read ? 'hover:bg-muted/30' : 'bg-primary/5 hover:bg-primary/10'
                }`}
                onClick={() => markAsRead(notif.id)}
              >
                <div className={`p-1.5 rounded-full flex-shrink-0 ${
                  notif.type === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900/40' :
                  notif.type === 'error'   ? 'bg-red-100 dark:bg-red-900/40' :
                                             'bg-blue-100 dark:bg-blue-900/40'
                }`}>
                  {notif.type === 'warning' && <AlertTriangle className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-400" />}
                  {notif.type === 'error'   && <AlertTriangle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />}
                  {notif.type === 'info'    && <Bell className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">
                    <span className="font-medium">{notif.employee}</span>{" "}{notif.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{notif.date}</p>
                </div>
                {!notif.read && <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />}
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog de refus */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Confirmer le refus</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Motif de refus <span className="text-destructive">*</span></label>
              <Select value={rejectReason} onValueChange={setRejectReason}>
                <SelectTrigger className="w-full h-9">
                  <SelectValue placeholder="Sélectionner un motif" />
                </SelectTrigger>
                <SelectContent>
                  {REJECT_REASONS.map(reason => (
                    <SelectItem key={reason} value={reason}>{reason}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Commentaire <span className="text-xs text-muted-foreground font-normal">(optionnel)</span>
              </label>
              <Textarea
                value={rejectComment}
                onChange={e => setRejectComment(e.target.value)}
                placeholder="Précisez la raison du refus si nécessaire..."
                className="min-h-20 resize-none text-sm"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Annuler</Button>
            <Button
              disabled={!rejectReason}
              variant="destructive"
              onClick={confirmReject}
            >
              <X className="w-4 h-4 mr-2" />
              Refuser la demande
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Sheet */}
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto p-0">
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-border">
            <SheetHeader>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedRequest?.employee.avatar} />
                  <AvatarFallback className="text-sm bg-muted text-muted-foreground">
                    {selectedRequest?.employee.initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <SheetTitle className="text-base font-semibold">{selectedRequest?.employee.name}</SheetTitle>
                  <SheetDescription className="text-sm">Employé</SheetDescription>
                </div>
              </div>
            </SheetHeader>
          </div>

          <div className="p-6 space-y-6">
            {/* Détails de la demande */}
            <div className="border border-border rounded-lg overflow-hidden divide-y divide-border">
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-muted-foreground">Type</span>
                <Badge className={(() => {
                  const d = selectedRequest?.details || ""
                  if (d === "Conges payes" || d === "Congés payés")
                    return "bg-violet-100 text-violet-700 hover:bg-violet-100 dark:bg-violet-900/40 dark:text-violet-300"
                  if (d === "Maladie")
                    return "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/40 dark:text-red-300"
                  if (d === "Télétravail" || d === "Teletravail")
                    return "bg-sky-100 text-sky-700 hover:bg-sky-100 dark:bg-sky-900/40 dark:text-sky-300"
                  return "bg-muted text-muted-foreground hover:bg-muted"
                })()}>
                  {selectedRequest?.details}
                </Badge>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" />
                  Période
                </span>
                <span className="text-sm font-medium text-foreground">{selectedRequest?.date}</span>
              </div>
              {selectedRequest?.duration && (
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" />
                    Durée
                  </span>
                  <span className="text-sm font-medium text-foreground">{selectedRequest?.duration}</span>
                </div>
              )}
            </div>

            {/* Solde */}
            <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-3">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Solde congés disponible : <span className="font-semibold">18 jours</span>
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-green-500/40 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/30 hover:border-green-500/70"
                onClick={() => selectedRequest && handleApprove(selectedRequest.id)}
              >
                <Check className="w-4 h-4 mr-1.5" />
                Approuver
              </Button>
              <Button
                variant="outline"
                className="flex-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/40"
                onClick={() => selectedRequest && handleReject(selectedRequest.id)}
              >
                <X className="w-4 h-4 mr-1.5" />
                Refuser
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
