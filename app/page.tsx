"use client"

import { ThemeProvider } from "next-themes"
import { AuthProvider } from "@/contexts/auth-context"
import { TimesheetProvider } from "@/contexts/timesheet-context"
import { MainApp } from "@/components/main-app"
import { RadSonner } from "@/components/ui/sonner"

export default function Home() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <AuthProvider>
        <TimesheetProvider>
          <MainApp />
          <RadSonner richColors closeButton position="bottom-right" />
        </TimesheetProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
