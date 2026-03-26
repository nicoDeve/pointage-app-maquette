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
import { 
  Check, 
  X, 
  Calendar, 
  Clock, 
  AlertTriangle,
  ChevronRight,
  Bell
} from "lucide-react"

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
    priority: "normal"
  },
  {
    id: "req2",
    type: "absence",
    employee: { name: "Jean Martin", initials: "JM" },
    details: "Maladie",
    date: "20 mars - 22 mars 2026",
    duration: "3 jours",
    status: "pending",
    priority: "urgent"
  },
  {
    id: "req3",
    type: "absence",
    employee: { name: "Sophie Leblanc", initials: "SL" },
    details: "Sans solde",
    date: "1 mai - 5 mai 2026",
    duration: "5 jours",
    status: "pending",
    priority: "normal"
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

  const handleRequestClick = (request: PendingRequest) => {
    setSelectedRequest(request)
    setIsDetailOpen(true)
  }

  const handleApprove = (requestId: string) => {
    setRequests(prev => prev.filter(r => r.id !== requestId))
    setIsDetailOpen(false)
  }

  const handleReject = (requestId: string) => {
    setRequests(prev => prev.filter(r => r.id !== requestId))
    setIsDetailOpen(false)
  }

  const markAsRead = (notifId: string) => {
    setNotifs(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n))
  }

  const unreadCount = notifs.filter(n => !n.read).length

  return (
    <div className="space-y-6">
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

        <TabsContent value="requests" className="mt-6">
          {requests.length === 0 ? (
            <Card className="border border-border">
              <CardContent className="p-8 text-center">
                <Check className="w-12 h-12 mx-auto text-green-500 mb-4" />
                <p className="text-muted-foreground">Aucune demande en attente</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {requests.map((request) => (
                <Card 
                  key={request.id} 
                  className="border border-border hover:border-primary/30 transition-colors cursor-pointer group"
                  onClick={() => handleRequestClick(request)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={request.employee.avatar} />
                          <AvatarFallback className="bg-muted text-muted-foreground text-sm">
                            {request.employee.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{request.employee.name}</span>
                            {request.priority === "urgent" && (
                              <Badge className="bg-red-100 text-red-700 hover:bg-red-100 text-xs">Urgent</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{request.details}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium text-foreground">{request.date}</p>
                          <p className="text-xs text-muted-foreground">{request.duration}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            size="icon" 
                            variant="outline" 
                            className="h-8 w-8 hover:bg-green-50 hover:text-green-600 hover:border-green-300"
                            onClick={(e) => { e.stopPropagation(); handleApprove(request.id) }}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="outline" 
                            className="h-8 w-8 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                            onClick={(e) => { e.stopPropagation(); handleReject(request.id) }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <div className="space-y-3">
            {notifs.map((notif) => (
              <Card 
                key={notif.id} 
                className={`border transition-colors cursor-pointer ${
                  notif.read ? 'border-border bg-background' : 'border-primary/30 bg-primary/5'
                }`}
                onClick={() => markAsRead(notif.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-full ${
                      notif.type === 'warning' ? 'bg-yellow-100' :
                      notif.type === 'error' ? 'bg-red-100' : 'bg-blue-100'
                    }`}>
                      {notif.type === 'warning' && <AlertTriangle className="w-4 h-4 text-yellow-600" />}
                      {notif.type === 'error' && <AlertTriangle className="w-4 h-4 text-red-600" />}
                      {notif.type === 'info' && <Bell className="w-4 h-4 text-blue-600" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-foreground">
                        <span className="font-medium">{notif.employee}</span>{" "}
                        {notif.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{notif.date}</p>
                    </div>
                    {!notif.read && (
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Detail Sheet */}
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto p-6">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-xl font-bold">
              Demande de {selectedRequest?.details}
            </SheetTitle>
            <SheetDescription>
              Soumise par {selectedRequest?.employee.name}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6">
            {/* Employee Info */}
            <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
              <Avatar className="h-12 w-12">
                <AvatarImage src={selectedRequest?.employee.avatar} />
                <AvatarFallback className="bg-background text-foreground">
                  {selectedRequest?.employee.initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-foreground">{selectedRequest?.employee.name}</p>
                <p className="text-sm text-muted-foreground">Employe</p>
              </div>
            </div>

            <Separator />

            {/* Request Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-lg">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Periode</p>
                  <p className="font-medium text-foreground">{selectedRequest?.date}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-lg">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Duree</p>
                  <p className="font-medium text-foreground">{selectedRequest?.duration}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Badge 
                  className={`${
                    selectedRequest?.details === "Conges payes" 
                      ? "bg-[#18181b] text-white hover:bg-[#18181b]"
                      : selectedRequest?.details === "Maladie"
                      ? "bg-purple-100 text-purple-700 hover:bg-purple-100"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {selectedRequest?.details}
                </Badge>
                {selectedRequest?.priority === "urgent" && (
                  <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Urgent</Badge>
                )}
              </div>
            </div>

            <Separator />

            {/* Solde info */}
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Solde conges disponible: <span className="font-semibold">18 jours</span>
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button 
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                onClick={() => selectedRequest && handleApprove(selectedRequest.id)}
              >
                <Check className="w-4 h-4 mr-2" />
                Approuver
              </Button>
              <Button 
                variant="outline"
                className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                onClick={() => selectedRequest && handleReject(selectedRequest.id)}
              >
                <X className="w-4 h-4 mr-2" />
                Refuser
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
