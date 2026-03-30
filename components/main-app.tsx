"use client"

import { useState } from "react"
import { useTheme } from "next-themes"
import { useAuth } from "@/contexts/auth-context"
import { useTimesheet } from "@/contexts/timesheet-context"
import { LoginPage } from "./login-page"
import { Dashboard } from "./dashboard"
import { TimesheetView } from "./timesheet-view"
import { AbsencesView } from "./absences-view"
import { AdminView } from "./admin-view"
import { SupportView } from "./support-view"
import { ActivityLogPopover } from "./activity-log-popover"
import { AppSidebar } from "./app-sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
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
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { getAppToday } from "@/lib/app-today"
import { notifySaved } from "@/lib/notify"

export function MainApp() {
  const { isAuthenticated, user, logout } = useAuth()
  const { currentView, setCurrentView, weeks } = useTimesheet()
  const { resolvedTheme, setTheme } = useTheme()
  const [selectedWeekId, setSelectedWeekId] = useState<string | undefined>(undefined)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [openTimesheetPanel, setOpenTimesheetPanel] = useState(false)
  const [openAbsencePanel, setOpenAbsencePanel] = useState(false)

  const isDarkMode = resolvedTheme === "dark"
  const toggleTheme = () => setTheme(isDarkMode ? "light" : "dark")

  const appToday = getAppToday()
  const appTodayLongLabel = (() => {
    const raw = format(appToday, "EEEE d MMMM yyyy", { locale: fr })
    return raw.charAt(0).toUpperCase() + raw.slice(1)
  })()
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
    const currentWeekId = weeks.find((w) => w.isCurrent)?.id
    if (view === "pointage") {
      setCurrentView("pointage")
      if (openPanel) {
        setSelectedWeekId(currentWeekId ?? weeks[weeks.length - 1]?.id)
        setOpenTimesheetPanel(true)
      } else {
        setSelectedWeekId(undefined)
      }
    } else if (view === "absence") {
      setCurrentView("absence")
      if (openPanel) {
        setOpenAbsencePanel(true)
      }
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
    notifySaved("Export lancé", "Le fichier CSV a été téléchargé.")
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
          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
            <div className="flex min-w-0 max-w-[min(100%,22rem)] items-center gap-1.5 text-xs text-muted-foreground sm:max-w-none sm:gap-2 sm:text-sm">
              <CalendarDays className="h-3.5 w-3.5 shrink-0 opacity-70 sm:h-4 sm:w-4" />
              <span className="truncate text-foreground font-medium">{appTodayLongLabel}</span>
            </div>

            <ActivityLogPopover />

            {/* Dark Mode Toggle */}
            <Button 
              variant="outline" 
              size="icon" 
              className="h-9 w-9"
              onClick={toggleTheme}
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
                <DropdownMenuItem onClick={toggleTheme}>
                  {isDarkMode ? <Sun className="w-4 h-4 mr-2" /> : <Moon className="w-4 h-4 mr-2" />}
                  {isDarkMode ? "Mode clair" : "Mode sombre"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    logout()
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Deconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main Content — min-h-0 pour que les vues (ex. Admin onglets) puissent occuper la hauteur restante */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-4">
          {renderView()}
        </div>
      </main>
    </div>
  )
}
