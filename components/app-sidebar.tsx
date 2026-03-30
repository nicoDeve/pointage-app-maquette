"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { NotificationCountPing } from "@/components/notification-count-ping"
import { ToastPingLayer } from "@/components/toast-ping-layer"
import {
  LayoutDashboard,
  Clock,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Shield,
  Users,
  Bell,
  HeadphonesIcon,
} from "lucide-react"

interface AppSidebarProps {
  currentView: string
  onNavigate: (view: string) => void
  notificationCount?: number
}

export function AppSidebar({ currentView, onNavigate, notificationCount = 3 }: AppSidebarProps) {
  const [timesheetExpanded, setTimesheetExpanded] = useState(true)
  const [adminExpanded, setAdminExpanded] = useState(false)

  return (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      {/* Logo / Company */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 rounded-lg">
            <AvatarImage src="/placeholder.svg?height=32&width=32&query=company+logo" alt="Company" />
            <AvatarFallback className="rounded-lg bg-sidebar-accent text-sidebar-accent-foreground text-xs">H</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">Holis pointage</p>
            <p className="text-xs text-sidebar-foreground/60 truncate">Enterprise</p>
          </div>
          <ChevronsUpDown className="w-4 h-4 text-sidebar-foreground/40" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <p className="text-xs text-sidebar-foreground/40 font-medium px-3 py-2">Plateforme</p>

        {/* Tableau de bord */}
        <button
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
            currentView === "dashboard" 
              ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
              : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          }`}
          onClick={() => onNavigate("dashboard")}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Tableau de bord</span>
        </button>

        {/* Groupe Feuille de temps */}
        <div>
          <button
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
              currentView === "pointage" || currentView === "absence"
                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            }`}
            onClick={() => setTimesheetExpanded(!timesheetExpanded)}
          >
            <Clock className="w-4 h-4" />
            <span className="flex-1 text-left">Feuille de temps</span>
            {timesheetExpanded ? (
              <ChevronUp className="w-4 h-4 text-sidebar-foreground/40" />
            ) : (
              <ChevronDown className="w-4 h-4 text-sidebar-foreground/40" />
            )}
          </button>
          
          {timesheetExpanded && (
            <div className="ml-7 mt-1 space-y-1">
              <button
                className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-md text-sm transition-colors ${
                  currentView === "pointage" 
                    ? "text-sidebar-foreground font-medium" 
                    : "text-sidebar-foreground/60 hover:text-sidebar-foreground"
                }`}
                onClick={() => onNavigate("pointage")}
              >
                Pointage
              </button>
              <button
                className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-md text-sm transition-colors ${
                  currentView === "absence" 
                    ? "text-sidebar-foreground font-medium" 
                    : "text-sidebar-foreground/60 hover:text-sidebar-foreground"
                }`}
                onClick={() => onNavigate("absence")}
              >
                Absences
              </button>
            </div>
          )}
        </div>

        {/* Section Administration */}
        <p className="text-xs text-sidebar-foreground/40 font-medium px-3 py-2 mt-4">Administration</p>

        <div className="relative w-full">
          <ToastPingLayer className="rounded-md" />
          <button
            type="button"
            className={`relative z-[1] w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
              currentView === "admin"
                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            }`}
            onClick={() => onNavigate("admin")}
          >
            <Shield className="w-4 h-4" />
            <span className="flex-1 text-left">Gestion</span>
            <NotificationCountPing
              count={notificationCount}
              variant="destructive"
              className="shrink-0"
              label="Notifications administration"
            />
          </button>
        </div>

        <button
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
            currentView === "support"
              ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
              : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          }`}
          onClick={() => onNavigate("support")}
        >
          <HeadphonesIcon className="w-4 h-4" />
          <span className="flex-1 text-left">Support</span>
        </button>
      </nav>

      </div>
  )
}
