"use client"

import { AuthProvider } from "@/contexts/auth-context"
import { TimesheetProvider } from "@/contexts/timesheet-context"
import { MainApp } from "@/components/main-app"

export default function Home() {
  return (
    <AuthProvider>
      <TimesheetProvider>
        <MainApp />
      </TimesheetProvider>
    </AuthProvider>
  )
}
