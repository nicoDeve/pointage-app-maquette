"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useTimesheet } from "@/contexts/timesheet-context"
import { LoginPage } from "./login-page"
import { Dashboard } from "./dashboard"
import { TimesheetView } from "./timesheet-view"
import { AbsencesView } from "./absences-view"
import { ProjectsView } from "./projects-view"
import { AdminView } from "./admin-view"
import { SupportView } from "./support-view"
import { ActivityLogPopover } from "./activity-log-popover"
import { AppSidebar } from "./app-sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CalendarDays, Sun, Moon, PanelLeftClose, PanelLeft, LogOut } from "lucide-react"
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, startOfQuarter, endOfQuarter } from "date-fns"
import { fr } from "date-fns/locale"

export function MainApp() {
  const { isAuthenticated, user, logout } = useAuth()
  const { currentView, setCurrentView } = useTimesheet()
  const [selectedWeekId, setSelectedWeekId] = useState<string | undefined>(undefined)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [openTimesheetPanel, setOpenTimesheetPanel] = useState(false)
  const [openAbsencePanel, setOpenAbsencePanel] = useState(false)
  
  // Date range state
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(2026, 0, 1),
    to: new Date(2026, 11, 31)
  })
  const [periodPreset, setPeriodPreset] = useState<string>("year")
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const [tempDateFrom, setTempDateFrom] = useState<Date | undefined>(dateRange.from)
  const [tempDateTo, setTempDateTo] = useState<Date | undefined>(dateRange.to)

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [isDarkMode])

  const handlePeriodChange = (preset: string) => {
    setPeriodPreset(preset)
    const now = new Date(2026, 9, 15)
    
    let newFrom: Date
    let newTo: Date
    
    switch (preset) {
      case "month":
        newFrom = startOfMonth(now)
        newTo = endOfMonth(now)
        break
      case "quarter":
        newFrom = startOfQuarter(now)
        newTo = endOfQuarter(now)
        break
      case "year":
        newFrom = startOfYear(now)
        newTo = endOfYear(now)
        break
      default:
        return
    }
    
    setTempDateFrom(newFrom)
    setTempDateTo(newTo)
    setDateRange({ from: newFrom, to: newTo })
    setIsDatePickerOpen(false)
  }

  const handleApplyCustomDates = () => {
    if (tempDateFrom && tempDateTo) {
      setDateRange({ from: tempDateFrom, to: tempDateTo })
    }
    setIsDatePickerOpen(false)
  }

  const formatDateRange = () => {
    const fromStr = format(dateRange.from, "MMM yyyy", { locale: fr })
    const toStr = format(dateRange.to, "MMM yyyy", { locale: fr })
    if (fromStr === toStr) return fromStr
    return `${fromStr} - ${toStr}`
  }

  if (!isAuthenticated) {
    return <LoginPage />
  }

  const handleNavigate = (view: string) => {
    setCurrentView(view as "dashboard" | "pointage" | "absence" | "admin" | "support")
    setSelectedWeekId(undefined)
    setOpenTimesheetPanel(false)
    setOpenAbsencePanel(false)
  }

  const handleDashboardNavigate = (view: string, openPanel?: boolean) => {
    if (view === "pointage") {
      setCurrentView("pointage")
      if (openPanel) {
        // Actions rapides "Saisir mes heures" → naviguer + ouvrir le panel de saisie
        setSelectedWeekId("w41")
        setOpenTimesheetPanel(true)
      } else {
        // Aperçu hebdomadaire → naviguer uniquement, sans ouvrir le panel
        setSelectedWeekId(undefined)
      }
    } else if (view === "absence") {
      setCurrentView("absence")
      if (openPanel) {
        // Actions rapides "Demander un congé" → naviguer + ouvrir le formulaire
        setOpenAbsencePanel(true)
      }
      // Demandes en attente → naviguer uniquement
    } else if (view === "projects") {
      setCurrentView("pointage")
    }
  }

  const handleExportCSV = () => {
    const csvContent = "Week,Hours,Status\n39,35,Complet\n40,35,Complet\n41,20,Incomplet"
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'pointage-export.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleBreadcrumbClick = (item: string) => {
    if (item === "Home" || item === "Dashboard") {
      setCurrentView("dashboard")
    } else if (item === "Timesheet") {
      setCurrentView("pointage")
    } else if (item === "Admin") {
      setCurrentView("admin")
    } else if (item === "Support") {
      setCurrentView("support")
    }
  }

  const getBreadcrumb = () => {
    switch (currentView) {
      case "dashboard":
        return [{ label: "Home", clickable: true }, { label: "Dashboard", clickable: false }]
      case "pointage":
        return [{ label: "Home", clickable: true }, { label: "Timesheet", clickable: true }, { label: "Pointage", clickable: false }]
      case "absence":
        return [{ label: "Home", clickable: true }, { label: "Timesheet", clickable: true }, { label: "Absence", clickable: false }]
      case "admin":
        return [{ label: "Home", clickable: true }, { label: "Admin", clickable: true }, { label: "Gestion", clickable: false }]
      case "support":
        return [{ label: "Home", clickable: true }, { label: "Admin", clickable: true }, { label: "Support", clickable: false }]
      default:
        return [{ label: "Home", clickable: false }]
    }
  }

  const breadcrumbItems = getBreadcrumb()

  const renderView = () => {
    switch (currentView) {
      case "dashboard":
        return <Dashboard onNavigate={handleDashboardNavigate} />
      case "pointage":
        return <TimesheetView initialWeekId={selectedWeekId} openPanelOnMount={openTimesheetPanel} onPanelClose={() => setOpenTimesheetPanel(false)} />
      case "absence":
        return <AbsencesView openPanelOnMount={openAbsencePanel} onPanelClose={() => setOpenAbsencePanel(false)} />
      case "admin":
        return <AdminView />
      case "support":
        return <SupportView />
      default:
        return <Dashboard onNavigate={handleDashboardNavigate} />
    }
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className={`flex-shrink-0 transition-all duration-300 ${isSidebarCollapsed ? 'w-0 overflow-hidden' : 'w-56'}`}>
        <AppSidebar currentView={currentView} onNavigate={handleNavigate} notificationCount={5} />
      </aside>
      
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex items-center justify-between px-6 py-3 border-b border-border bg-background">
          {/* Left side - Toggle + Breadcrumb */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            >
              {isSidebarCollapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </Button>
            
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbItems.flatMap((item, index) => {
                  const elements = []
                  if (index > 0) {
                    elements.push(<BreadcrumbSeparator key={`sep-${index}`} />)
                  }
                  elements.push(
                    <BreadcrumbItem key={`item-${index}`}>
                      {item.clickable ? (
                        <BreadcrumbLink 
                          className="cursor-pointer"
                          onClick={() => handleBreadcrumbClick(item.label)}
                        >
                          {item.label}
                        </BreadcrumbLink>
                      ) : (
                        <BreadcrumbPage>{item.label}</BreadcrumbPage>
                      )}
                    </BreadcrumbItem>
                  )
                  return elements
                })}
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Date Range Picker */}
            <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 h-9 font-normal">
                  <CalendarDays className="w-4 h-4" />
                  {formatDateRange()}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <div className="border-b border-border">
                  <div className="flex">
                    {[
                      { value: "month", label: "Mois" },
                      { value: "quarter", label: "Trimestre" },
                      { value: "year", label: "Annee" },
                      { value: "custom", label: "Personnalise" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => option.value === "custom" ? setPeriodPreset("custom") : handlePeriodChange(option.value)}
                        className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
                          periodPreset === option.value 
                            ? "bg-background text-foreground border-b-2 border-primary" 
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {periodPreset === "custom" && (
                  <div className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Date de debut</label>
                        <Calendar
                          mode="single"
                          selected={tempDateFrom}
                          onSelect={setTempDateFrom}
                          className="rounded-md border p-2"
                          initialFocus
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Date de fin</label>
                        <Calendar
                          mode="single"
                          selected={tempDateTo}
                          onSelect={setTempDateTo}
                          className="rounded-md border p-2"
                        />
                      </div>
                    </div>
                    <Separator />
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setIsDatePickerOpen(false)}>
                        Annuler
                      </Button>
                      <Button size="sm" onClick={handleApplyCustomDates}>
                        Appliquer
                      </Button>
                    </div>
                  </div>
                )}
              </PopoverContent>
            </Popover>

            <ActivityLogPopover />

            {/* Dark Mode Toggle */}
            <Button 
              variant="outline" 
              size="icon" 
              className="h-9 w-9"
              onClick={() => setIsDarkMode(!isDarkMode)}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            
            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full p-0">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.avatar} alt={user?.name} />
                    <AvatarFallback className="text-xs bg-gradient-to-br from-pink-400 to-purple-500 text-white">
                      {user?.name?.split(" ").map((n) => n[0]).join("") || "N"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user?.name || "Utilisateur"}</p>
                  <p className="text-xs text-muted-foreground">{user?.email || "email@example.com"}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setIsDarkMode(!isDarkMode)}>
                  {isDarkMode ? <Sun className="w-4 h-4 mr-2" /> : <Moon className="w-4 h-4 mr-2" />}
                  {isDarkMode ? "Mode clair" : "Mode sombre"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  Deconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 overflow-auto px-4 py-4">
          {renderView()}
        </div>
      </main>
    </div>
  )
}
