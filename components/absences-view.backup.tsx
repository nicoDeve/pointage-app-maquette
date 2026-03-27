"use client"

import { useState } from "react"
import { useTimesheet, Absence } from "@/contexts/timesheet-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { InfoCardPopover } from "@/components/info-card-popover"
import { Palmtree, CalendarIcon, ChevronDown, Info, CalendarDays, Clock, Plus } from "lucide-react"
import { format, differenceInBusinessDays } from "date-fns"
import { fr } from "date-fns/locale"

interface AbsencesViewProps {
  openDetail?: boolean
  absenceType?: string
  openPanelOnMount?: boolean
  onPanelClose?: () => void
}

export function AbsencesView({ openDetail = false, absenceType: initialType, openPanelOnMount, onPanelClose }: AbsencesViewProps) {
  const { absences, addAbsence, getCongesBalance } = useTimesheet()
  const [isDetailOpen, setIsDetailOpen] = useState(openDetail || openPanelOnMount)
  const [absenceType, setAbsenceType] = useState<string>(initialType || "")
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [isHalfDay, setIsHalfDay] = useState(false)
  const [motif, setMotif] = useState("")
  const [filter, setFilter] = useState("all")

  const congesBalance = getCongesBalance()
  const congesPayesUsed = absences.filter(a => a.type === "conges_payes").reduce((sum, a) => sum + a.duration, 0)
  const congesPayesRemaining = congesBalance.total - congesPayesUsed
  const congesPayesRemainingHours = congesPayesRemaining * 7 // 7h par jour
  const absencesCount = absences.filter(a => a.type !== "conges_payes").reduce((sum, a) => sum + a.duration, 0)
  const absencesHours = absencesCount * 7

  const absenceTypes = [
    { value: "conges_payes", label: "Conges payes", color: "#8b5cf6" },
    { value: "maladie", label: "Maladie", color: "#ef4444" },
    { value: "sans_solde", label: "Sans solde", color: "#6b7280" },
  ]

  const calculateDuration = () => {
    if (!startDate || !endDate) return 0
    const days = differenceInBusinessDays(endDate, startDate) + 1
    return isHalfDay ? 0.5 : Math.max(days, 1)
  }

  const handleSubmit = () => {
    if (absenceType && startDate && endDate) {
      const typeInfo = absenceTypes.find(t => t.value === absenceType)
      addAbsence({
        type: absenceType as Absence["type"],
        typeLabel: typeInfo?.label || absenceType,
        startDate: format(startDate, "d MMM.", { locale: fr }),
        endDate: format(endDate, "d MMM. yyyy", { locale: fr }),
        duration: calculateDuration(),
        status: "en_attente",
      })
      setIsDetailOpen(false)
      resetForm()
    }
  }

  const resetForm = () => {
    setAbsenceType("")
    setStartDate(undefined)
    setEndDate(undefined)
    setIsHalfDay(false)
    setMotif("")
  }

  const handleOpenDetail = (type?: string) => {
    resetForm()
    if (type) setAbsenceType(type)
    setIsDetailOpen(true)
  }

  const getStatusBadge = (status: Absence["status"]) => {
    switch (status) {
      case "approuvee":
        return <Badge className="bg-green-500 text-white hover:bg-green-500 text-xs font-normal">approuvee</Badge>
      case "refusee":
        return <Badge className="bg-red-500 text-white hover:bg-red-500 text-xs font-normal">refusee</Badge>
      default:
        return <Badge className="bg-yellow-400 text-yellow-900 hover:bg-yellow-400 text-xs font-normal">En attente</Badge>
    }
  }

  const filteredAbsences = filter === "all" ? absences : absences.filter(a => a.status === filter)

  return (
    <div className="space-y-6">
      {/* Solde de conges - utilises sur total */}
      <Card className="border border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Solde de conges</span>
            <Palmtree className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-foreground">{congesPayesUsed}</span>
              <span className="text-sm text-muted-foreground">/{congesBalance.total}J utilises</span>
            </div>
            <Progress value={(congesPayesUsed / congesBalance.total) * 100} className="h-1.5 bg-muted [&>div]:bg-blue-500" />
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards - Jours restants avec info card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoCardPopover
          variant="stats"
          trigger="hover"
          title="Conges payes"
          subtitle="Solde disponible"
          theme="blue"
          side="bottom"
          align="start"
          stats={[
            { label: "Jours restants",    value: `${congesPayesRemaining} jours` },
            { label: "Equivalent heures", value: `${congesPayesRemainingHours}h`  },
            { label: "Base calcul",       value: "7h / jour", subtle: true        },
          ]}
          action={{
            label: "Demander des conges",
            icon: <Plus className="w-4 h-4" />,
            onClick: () => handleOpenDetail("conges_payes"),
          }}
        >
          <Card className="border border-border cursor-pointer transition-all hover:shadow-md hover:border-primary/30 group">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Conges payes disponibles</span>
                <CalendarDays className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-foreground">{congesPayesRemaining}j</span>
                <span className="text-xs text-muted-foreground">restants</span>
              </div>
            </CardContent>
          </Card>
        </InfoCardPopover>

        <InfoCardPopover
          variant="stats"
          trigger="hover"
          title="Absences & Times off"
          subtitle="Historique"
          theme="orange"
          side="bottom"
          align="start"
          stats={[
            { label: "Jours pris",        value: `${absencesCount} jours` },
            { label: "Equivalent heures", value: `${absencesHours}h`      },
            { label: "Inclut",            value: "Maladie, sans solde", subtle: true },
          ]}
          action={{
            label: "Declarer une absence",
            icon: <Plus className="w-4 h-4" />,
            onClick: () => handleOpenDetail(),
          }}
        >
          <Card className="border border-border cursor-pointer transition-all hover:shadow-md hover:border-primary/30 group">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Absences & Times off</span>
                <Clock className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-foreground">{absencesCount}j</span>
                <span className="text-xs text-muted-foreground">pris</span>
              </div>
            </CardContent>
          </Card>
        </InfoCardPopover>
      </div>

      {/* Mes demandes */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Mes demandes</h2>
          <div className="flex items-center gap-2">
            <Button 
              onClick={() => handleOpenDetail()}
              className="bg-[#18181b] hover:bg-[#18181b]/90 text-white h-9"
            >
              Ajouter
            </Button>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-32 h-9">
                <SelectValue>Toutes ({absences.length})</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes ({absences.length})</SelectItem>
                <SelectItem value="en_attente">En attente</SelectItem>
                <SelectItem value="approuvee">Approuvees</SelectItem>
                <SelectItem value="refusee">Refusees</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-3">
          {filteredAbsences.map((absence) => (
            <div key={absence.id} className="p-4 border-b border-border last:border-b-0">
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-foreground">
                      {absence.startDate} - {absence.endDate}
                    </p>
                    <p className="text-sm text-muted-foreground">{absence.duration} jour{absence.duration > 1 ? "s" : ""}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-[#18181b] text-white hover:bg-[#18181b] text-xs font-normal">
                    {absence.typeLabel}
                  </Badge>
                  {getStatusBadge(absence.status)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail Sheet */}
      <Sheet open={isDetailOpen} onOpenChange={(open) => {
        setIsDetailOpen(open)
        if (!open && onPanelClose) onPanelClose()
      }}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto p-6">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-xl font-bold">
              Demande d&apos;absence
            </SheetTitle>
            <SheetDescription>
              Remplissez le formulaire pour soumettre votre demande. Elle sera envoyee a votre referent pour validation.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6">
            {/* Type d'absence */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Type d&apos;absence</label>
              <Select value={absenceType} onValueChange={setAbsenceType}>
                <SelectTrigger className="w-full h-10">
                  <SelectValue placeholder="Selectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  {absenceTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: type.color }} />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Date de debut</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between text-left font-normal h-10"
                    >
                      <span className={!startDate ? "text-muted-foreground" : ""}>
                        {startDate ? format(startDate, "d MMM yyyy", { locale: fr }) : "Selectionner un type"}
                      </span>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => {
                        setStartDate(date)
                        if (endDate && date && date > endDate) {
                          setEndDate(undefined)
                        }
                      }}
                      locale={fr}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Date de fin</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between text-left font-normal h-10"
                    >
                      <span className={!endDate ? "text-muted-foreground" : ""}>
                        {endDate ? format(endDate, "d MMM yyyy", { locale: fr }) : "Selectionner un type"}
                      </span>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      disabled={(date) => (startDate ? date < startDate : false)}
                      locale={fr}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Demi-journee */}
            <div className="flex items-center gap-2">
              <Checkbox 
                id="halfday" 
                checked={isHalfDay}
                onCheckedChange={(checked) => setIsHalfDay(checked === true)}
              />
              <label htmlFor="halfday" className="text-sm text-muted-foreground cursor-pointer">
                Demi-journee
              </label>
            </div>

            {/* Motif */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Motif (optionnel)</label>
              <Textarea
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                placeholder="Precisez le motif de votre demande..."
                className="min-h-24 resize-none"
              />
            </div>

            {/* Info box */}
            <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex gap-3">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-200">Processus de validation</p>
                  <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                    Votre demande sera soumise a votre referent pour approbation. Vous recevrez une notification une fois la decision prise.
                  </p>
                </div>
              </div>
            </div>

            {/* Duration display */}
            {startDate && endDate && (
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <span className="text-sm text-muted-foreground">Duree demandee</span>
                <span className="text-lg font-bold text-foreground">{calculateDuration()} jours</span>
              </div>
            )}

            <Button
              onClick={handleSubmit}
              disabled={!absenceType || !startDate || !endDate}
              className="w-full bg-[#18181b] hover:bg-[#18181b]/90 text-white"
            >
              Enregistrer
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
